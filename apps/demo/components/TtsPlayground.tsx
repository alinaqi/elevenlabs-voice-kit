'use client'
import { useEffect, useState } from 'react'

const SAMPLES = { en: 'Welcome to Dubai Silicon Oasis. Dtec is on the first floor of TechnoHub 1.', ar: 'أهلاً وسهلاً في واحة دبي للسيليكون. كيف يمكنني مساعدتك اليوم؟' }
interface Voice { id: string, name: string }

export function TtsPlayground () {
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [text, setText] = useState(SAMPLES.en)
  const [voices, setVoices] = useState<Voice[]>([])
  const [voiceId, setVoiceId] = useState('')
  const [src, setSrc] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/voices').then((r) => r.json()).then((v) => Array.isArray(v) && setVoices(v)).catch(() => {}) }, [])

  async function speak () {
    setBusy(true); setError('')
    const res = await fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, language, voiceId: voiceId || undefined }) })
    setBusy(false)
    if (!res.ok) return setError((await res.json()).error)
    setSrc(URL.createObjectURL(await res.blob()))
  }

  return (
    <div className='card'>
      <div className='row'>
        {(['en', 'ar'] as const).map((l) => <button key={l} className={`btn ${language === l ? 'solid' : ''}`} onClick={() => { setLanguage(l); setText(SAMPLES[l]) }}>{l === 'en' ? 'English' : 'عربي'}</button>)}
        <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} style={{ maxWidth: 280 }}>
          <option value=''>default voice (multilingual)</option>
          {voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <textarea rows={4} dir='auto' value={text} maxLength={600} onChange={(e) => setText(e.target.value)} style={{ margin: '12px 0' }} />
      <div className='row'>
        <button className='btn solid' onClick={speak} disabled={busy || !text.trim()}>{busy ? 'generating…' : '▶ speak'}</button>
        {src && <audio src={src} controls autoPlay />}
      </div>
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
