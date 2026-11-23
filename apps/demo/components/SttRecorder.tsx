'use client'
import { useRef, useState } from 'react'

export function SttRecorder () {
  const recorder = useRef<MediaRecorder>(null)
  const [recording, setRecording] = useState(false)
  const [result, setResult] = useState<{ text: string, language: string } | null>(null)
  const [error, setError] = useState('')

  async function start () {
    setError(''); setResult(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const form = new FormData()
      form.append('file', new Blob(chunks, { type: rec.mimeType }), 'speech.webm')
      const res = await fetch('/api/stt', { method: 'POST', body: form })
      const body = await res.json()
      res.ok ? setResult(body) : setError(body.error)
    }
    rec.start(); recorder.current = rec; setRecording(true)
  }
  const stop = () => { recorder.current?.stop(); setRecording(false) }

  return (
    <div className='card'>
      {!recording ? <button className='btn solid' onClick={() => start().catch((e: Error) => setError(e.message))}>● record</button> : <button className='btn stop' onClick={stop}>■ stop & transcribe</button>}
      {result && <div className='line agent' dir='auto' style={{ marginTop: 16 }}><span className='who'>detected: {result.language}</span>{result.text}</div>}
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
