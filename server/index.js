const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SOIM Backend is running!');
});

const extractImagesFromHtml = (html) => {
  const regex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
};

app.post('/api/fetch-article', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract slug from URL (assuming URL structure like https://artmarks.net/post-slug/)
    const urlParts = url.split('/').filter(part => part);
    const slug = urlParts[urlParts.length - 1];

    // Fetch from WordPress REST API
    const wpApiUrl = `https://artmarks.net/wp-json/wp/v2/posts?slug=${slug}&_embed`;
    const wpResponse = await axios.get(wpApiUrl);

    if (wpResponse.data.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = wpResponse.data[0];
    const featuredImage = article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

    // Extract all images from content
    const contentImages = extractImagesFromHtml(article.content?.rendered || '');
    const allImages = [...new Set([featuredImage, ...contentImages].filter(Boolean))];
    
    // Extract content (strip HTML tags)
    const content = article.content?.rendered?.replace(/<[^>]*>/g, '') || '';

    res.json({
      title: article.title?.rendered || '',
      content: content,
      excerpt: article.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
      featuredImage: featuredImage,
      images: allImages,
      url: article.link
    });

  } catch (error) {
    console.error('Error fetching article:', error.message);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

app.post('/api/generate-summary', async (req, res) => {
  try {
    const { content, platform = 'instagram', variation = 0 } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const maxLength = platform === 'x' ? 240 : 500;
    const variationPrompt = variation > 0 ? ` (المحاكي رقم ${variation + 1}، جاهز من قبل)` : '';
    const prompt = `قم بإنشاء مختصر تشويقي ومشوق باللغة العربية للمقال التالي، بحيث لا يتجاوز ${maxLength} حرفًا، مع التركيز على النقاط الرئيسية التي تجعل القارئ يريد قراءة المقال كاملاً${variationPrompt}:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.json({ summary });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
