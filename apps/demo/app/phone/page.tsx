import { PHONE_NUMBER } from '@/lib/server'

const FLOW = `caller ──PSTN──▶ Twilio ──<Gather> ElevenLabs-voiced EN/AR menu (press 1/2/3)
                       └─<Connect><Stream>──WebSocket──▶ apps/phone bridge
                                                     ├─ μ-law 8 kHz ⇄ ElevenAgents (same agent, phone variant)
                                                     ├─ tools run server-side (bookings, routes, research)
                                                     └─ slow tool? stream ElevenLabs hold music, clear on reply`

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Phone <em>line</em></h1>
      <div className='card'>
        <p className='dim'>Call now — English or Arabic:</p>
        <h2 style={{ fontSize: 36, color: 'var(--green)' }}><a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`}>{PHONE_NUMBER}</a></h2>
        <p>Press <b>1</b> Voice Navigator · <b>2</b> Soft Landing Guide · <b>3</b> HALA Concierge</p>
        <p className='dim'>Ask something outside the agent&apos;s knowledge (e.g. “which metro station is closest?”) to hear the hold music while it researches.</p>
      </div>
      <h2 className='prompt' style={{ marginTop: 24 }}>how it works</h2>
      <pre>{FLOW}</pre>
      <p className='dim'>Run your own: <code>apps/phone</code> in the starter kit (Node, deploy to Render/Fly — it needs a long-lived WebSocket). Optional add-on: needs Twilio credentials.</p>
    </>
  )
}
