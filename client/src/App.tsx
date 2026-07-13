import { useState } from 'react'
import './App.css'
import axios from 'axios'
import TemplateEditor from './TemplateEditor'

const BACKEND_URL = "http://localhost:5000"

interface Article {
  title: string
  content: string
  excerpt: string
  featuredImage: string
  images: string[]
  url: string
}

function App() {
  const [url, setUrl] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<string[]>([])
  const [platform, setPlatform] = useState('instagram')
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [numPosts, setNumPosts] = useState(1)

  const handleFetchArticle = async () => {
    if (!url) return
    setLoading(true)
    try {
      const response = await axios.post(`${BACKEND_URL}/api/fetch-article`, { url })
      setArticle({
        ...response.data,
        images: response.data.featuredImage ? [response.data.featuredImage] : []
      })
      setSummaries([])
    } catch (error) {
      console.error('Error fetching article:', error)
      alert('فشل جلب المقال. تأكد من تشغيل الخادم المحلي أو نشره!')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummaries = async () => {
    if (!article) return
    setGeneratingSummary(true)
    const newSummaries: string[] = []
    try {
      for (let i = 0; i < numPosts; i++) {
        const response = await axios.post(`${BACKEND_URL}/api/generate-summary`, {
          content: article.content,
          platform: platform,
          variation: i
        })
        newSummaries.push(response.data.summary)
      }
      setSummaries(newSummaries)
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('فشل توليد الخلاصة. تأكد من إضافة مفتاح Gemini API للخادم!')
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>نظام SOIM لإنشاء البوستات</h1>
      </header>

      <section className="section fetch-section">
        <label>رابط المقال من artmarks.net</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://artmarks.net/..."
        />
        <button onClick={handleFetchArticle} disabled={loading} className="primary-btn">
          {loading ? 'جارٍ جلب المقال...' : 'جلب المقال'}
        </button>
      </section>

      {article && (
        <>
          <section className="section article-preview">
            <h2>{article.title}</h2>
            {article.featuredImage && <img src={article.featuredImage} alt="" className="article-preview-img" />}
            <p className="article-excerpt">{article.excerpt}</p>
          </section>

          <section className="section summary-section">
            <div className="summary-controls">
              <div className="control-row">
                <label>المنصة المستهدفة</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="instagram">إنستغرام</option>
                  <option value="x">X (تويتر)</option>
                  <option value="facebook">فيس بوك</option>
                </select>
              </div>

              <div className="control-row">
                <label>عدد البوستات: {numPosts}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numPosts}
                  onChange={(e) => setNumPosts(Number(e.target.value))}
                />
              </div>

              <button onClick={handleGenerateSummaries} disabled={generatingSummary} className="primary-btn">
                {generatingSummary ? 'جارٍ توليد الخلاصات...' : 'توليد الخلاصات'}
              </button>
            </div>

            {summaries.length > 0 && (
              <div className="summaries-list">
                {summaries.map((sum, i) => (
                  <div key={i} className="summary-item">
                    <label>بوست {i + 1}</label>
                    <textarea
                      value={sum}
                      onChange={(e) => {
                        const updated = [...summaries]
                        updated[i] = e.target.value
                        setSummaries(updated)
                      }}
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {summaries.length > 0 && (
            <section className="section template-section">
              <h2>محرر القوالب</h2>
              {summaries.map((sum, i) => (
                <div key={i} className="template-editor-wrapper">
                  <h3>تصميم البوست {i + 1}</h3>
                  <TemplateEditor
                    articleTitle={article.title}
                    articleSummary={sum}
                    articleImages={article.images}
                  />
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default App
