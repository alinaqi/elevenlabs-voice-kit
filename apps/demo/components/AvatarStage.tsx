'use client'
import { useState } from 'react'

const PRESETS = [{ id: 'hala', label: 'HALA Concierge' }, { id: 'navigator', label: 'Voice Navigator' }, { id: 'soft-landing', label: 'Soft Landing' }]

export function AvatarStage () {
  const [preset, setPreset] = useState('hala')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function open () {
    setBusy(true); setError(''); setUrl('')
    const res = await fetch(`/api/avatar?preset=${preset}`)
    const body = await res.json()
    setBusy(false)
    res.ok ? setUrl(body.url) : setError(body.error)
  }

  return (
    <div className='console' style={{ gridTemplateColumns: 'minmax(260px, 360px) 1fr' }}>
      <div className='card'>
        <div className='row'>{PRESETS.map((p) => <button key={p.id} className={`btn ${preset === p.id ? 'solid' : ''}`} onClick={() => setPreset(p.id)}>{p.label}</button>)}</div>
        <p className='dim'>Loads a LiveAvatar face wired to the ElevenLabs agent. Press start inside the frame and allow the mic. Sessions last 2 minutes.</p>
        <button className='btn solid' onClick={open} disabled={busy}>{busy ? 'preparing avatar…' : '▶ load avatar'}</button>
        {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
      </div>
      <div className='card'>
        {url
          ? <iframe className='avatar' src={url} title='Talking avatar' allow='camera; microphone; autoplay; fullscreen' />
          : <p className='dim prompt'>avatar not loaded</p>}
      </div>
    </div>
  )
}
