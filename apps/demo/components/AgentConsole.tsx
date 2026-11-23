'use client'
import { useVoiceAgent, VoiceKitProvider } from '@workhub/voice-kit/react'
import { useEffect, useRef, useState } from 'react'
import type { Challenge } from '@/lib/challenges'
import { EventCard } from './EventCard'
import { Wave } from './Wave'

function Controls ({ agent, error }: { agent: ReturnType<typeof useVoiceAgent>, error: string }) {
  const live = agent.status === 'connected'
  return (
    <div className='card'>
      <div className='row'><span className={`tag ${live ? 'live' : ''}`}>● {agent.status}</span>{agent.onHold && <span className='tag hold'>♪ on hold — researching</span>}</div>
      <Wave on={live && (agent.isSpeaking || agent.onHold)} />
      <div className='row'>
        {!live && <button className='btn solid' onClick={agent.start} disabled={agent.status === 'connecting'}>▶ start talking</button>}
        {live && <button className='btn stop' onClick={agent.stop}>■ end</button>}
      </div>
      {error && <p style={{ color: 'var(--red)' }}>{error}</p>}
      <p className='dim' style={{ fontSize: 12 }}>Mic required. Speak English or Arabic and switch any time.</p>
    </div>
  )
}

function Transcript ({ lines }: { lines: Array<{ role: string, text: string }> }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines.length])
  return (
    <div className='card transcript'>
      {!lines.length && <p className='dim prompt'>waiting for conversation…</p>}
      {lines.map((l, i) => (
        <div key={i} className={`line ${l.role}`} dir='auto'><span className='who'>{l.role}</span>{l.text}</div>
      ))}
      <div ref={end} />
    </div>
  )
}

function Console ({ challenge }: { challenge: Challenge }) {
  const agent = useVoiceAgent({ preset: challenge.id })
  const [error, setError] = useState('')
  const start = () => { setError(''); agent.start().catch((e: Error) => setError(e.message)) }
  return (
    <div className='console'>
      <div>
        <Controls agent={{ ...agent, start } as never} error={error} />
        <div className='card' style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14 }} className='prompt'>try saying</h3>
          {challenge.trySaying.map((t) => <p key={t} dir='auto' className='dim'>“{t}”</p>)}
        </div>
      </div>
      <Transcript lines={agent.lines} />
      <div className='card'>
        <h3 style={{ fontSize: 14 }} className='prompt'>tool calls</h3>
        {!agent.events.length && <p className='dim'>Bookings, routes, checklists, research and handovers appear here.</p>}
        {agent.events.map((e, i) => <EventCard key={i} event={e} />)}
      </div>
    </div>
  )
}

export function AgentConsole ({ challenge }: { challenge: Challenge }) {
  return <VoiceKitProvider><Console challenge={challenge} /></VoiceKitProvider>
}
