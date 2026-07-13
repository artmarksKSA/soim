import { useState } from 'react'
import './App.css'
import axios from 'axios'
import TemplateEditor from './TemplateEditor'

interface Article {
  title: string
  content: string
  excerpt: string
  featuredImage: string
  url: string
}

function App() {
  const [url, setUrl] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const handleFetchArticle = async () => {
    if (!url) return
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:5000/api/fetch-article', { url })
      setArticle(response.data)
      setSummary('')
    } catch (error) {
      console.error('Error fetching article:', error)
      alert('فشل جلب المقال')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!article) return
    setGeneratingSummary(true)
    try {
      const response = await axios.post('http://localhost:5000/api/generate-summary', {
        content: article.content,
        platform: platform
      })
      setSummary(response.data.summary)
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('فشل توليد المختصر')
    } finally {
      setGeneratingSummary(false)
    }
  }

  return (
    <div className="app">
      <h1>نظام توليد وتنشير البوستات - SOIM</h1>
      
      <section className="section">
        <label>رابط المقال من artmarks.net</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://artmarks.net/..."
        />
        <button onClick={handleFetchArticle} disabled={loading}>
          {loading ? 'جارٍ جلب المقال...' : 'جلب المقال'}
        </button>
      </section>

      {article && (
        <>
          <section className="section">
            <h2>{article.title}</h2>
            {article.featuredImage && <img src={article.featuredImage} alt="" style={{ maxWidth: '100%', marginBottom: '1rem' }} />}
            <p>{article.excerpt}</p>
          </section>

          <section className="section">
            <label>المنصة المستهدفة</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '4px',
                color: 'white',
                marginBottom: '1rem',
              }}
            >
              <option value="instagram">إنستغرام</option>
              <option value="x">X (تويتر)</option>
              <option value="facebook">فيس بوك</option>
            </select>

            <button onClick={handleGenerateSummary} disabled={generatingSummary}>
              {generatingSummary ? 'جارٍ توليد المختصر...' : 'توليد مختصر تشويقي'}
            </button>

            {summary && (
              <div style={{ marginTop: '1rem' }}>
                <label>المختصر:</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} />
              </div>
            )}
          </section>

          {summary && (
            <section className="section">
              <h2>محرر القوالب</h2>
              <TemplateEditor
                articleTitle={article.title}
                articleSummary={summary}
                articleImage={article.featuredImage}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default App
