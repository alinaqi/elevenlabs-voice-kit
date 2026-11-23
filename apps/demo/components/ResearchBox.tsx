'use client'
import { browserHold } from '@workhub/voice-kit/react'
import { withHold, type ResearchAnswer } from '@workhub/voice-kit/tools'
import { useMemo, useState } from 'react'

const EXAMPLES = ['Which bus routes serve DSO?', 'What is the minimum capital for a DSO company?', 'Which metro station is closest to Dubai Silicon Oasis?', 'What documents do I need for an FZCO?']

export function ResearchBox () {
  const [q, setQ] = useState(EXAMPLES[0])
  const [answer, setAnswer] = useState<ResearchAnswer & { ms: number } | null>(null)
  const [onHold, setOnHold] = useState(false)
  const [busy, setBusy] = useState(false)
  const music = useMemo(() => typeof window === 'undefined' ? null : browserHold('/hold-music.mp3'), [])

  async function ask (question: string) {
    if (!music) return
    setBusy(true); setAnswer(null)
    const t = performance.now()
    const hold = { start: () => { setOnHold(true); music.start() }, stop: () => { setOnHold(false); music.stop() } }
    const res = await withHold(() => fetch('/api/research', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) }).then((r) => r.json()), hold)
    setAnswer({ ...res, ms: Math.round(performance.now() - t) }); setBusy(false)
  }

  return (
    <div className='card'>
      <div className='row'>{EXAMPLES.map((e) => <button key={e} className='tag' style={{ cursor: 'pointer', background: 'none' }} onClick={() => setQ(e)}>{e}</button>)}</div>
      <div className='row' style={{ marginTop: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} dir='auto' style={{ flex: 1, minWidth: 220 }} />
        <button className='btn solid' disabled={busy} onClick={() => ask(q)}>{busy ? '…' : 'ask'}</button>
      </div>
      {onHold && <p className='hold'>♪ on hold — researching live (hold music starts after 1.2s)…</p>}
      {answer && (
        <div className='line agent' style={{ marginTop: 16 }} dir='auto'>
          <span className='who'>{answer.cached ? 'prefetched fact' : 'live research'} · {answer.ms} ms</span>
          {answer.answer}
          <div className='dim' style={{ fontSize: 12, marginTop: 6 }}>{answer.sources.join(' · ')}</div>
        </div>
      )}
    </div>
  )
}
