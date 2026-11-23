import Link from 'next/link'
import { Wave } from '@/components/Wave'
import { CHALLENGES } from '@/lib/challenges'
import { PHONE_NUMBER } from '@/lib/server'

const QUICKSTART = `npm i https://github.com/alinaqi/elevenlabs-voice-kit/releases/download/v0.1.1/workhub-voice-kit-0.1.1.tgz
# .env — the only key you need
ELEVENLABS_API_KEY=sk_...

// app/api/token/route.ts
import { createVoiceKit } from '@workhub/voice-kit'
import { tokenRoute } from '@workhub/voice-kit/next'
export const GET = tokenRoute({ kit: createVoiceKit() })

// any client component
const agent = useVoiceAgent({ preset: 'hala' })
<button onClick={agent.start}>Talk</button>`

const EXTRAS = [
  { href: '/avatar', tag: 'web', title: 'Talking avatar', text: 'Same agent with a lip-synced video face (LiveAvatar).' },
  { href: '/phone', tag: 'phone', title: `Call ${PHONE_NUMBER}`, text: 'Same agents on a real phone line via Twilio, with hold music.' },
  { href: '/research', tag: 'facts', title: 'Fact research', text: 'Pre-researched hackathon facts + live lookups (Gemini 3.8 Flash + OpenAI).' },
  { href: '/tts', tag: 'tts', title: 'Text → speech', text: 'English and Arabic voices, one call.' },
  { href: '/stt', tag: 'stt', title: 'Speech → text', text: 'Record and transcribe with Scribe.' },
  { href: '/build', tag: 'code', title: 'Use it in your app', text: 'Drop-in routes, React hook, Speech Engine, presets.' },
  { href: '/docs', tag: 'llms.txt', title: 'Point Claude / Codex here', text: 'Docs + /llms.txt so your coding agent can integrate the kit for you.' }
]

export default function Home () {
  return (
    <>
      <section style={{ padding: '32px 0 8px' }}>
        <span className='tag live'>● live demo</span><span className='tag'>one key</span><span className='tag'>EN / عربي</span>
        <h1>Voice of the <em>Oasis</em><br />starter kit</h1>
        <Wave on />
        <p className='dim' style={{ maxWidth: 680 }}>
          Everything you need to ship an ElevenLabs voice agent in 24 hours: bilingual agents for all three challenges,
          booking and handover tools, fact research with hold music, phone and avatar add-ons — with a single ElevenLabs key.
        </p>
      </section>
      <h2 className='prompt' style={{ marginTop: 32 }}>challenges</h2>
      <div className='grid'>
        {CHALLENGES.map((c) => (
          <Link key={c.id} href={`/agents/${c.id}`} className='card' style={{ color: 'inherit' }}>
            <div className='code'>CHALLENGE {c.code} · {c.where}</div>
            <h3 style={{ marginTop: 8 }}>{c.title}</h3>
            <p className='dim'>{c.pitch}</p>
            <span style={{ color: 'var(--green)' }}>▶ talk to it</span>
          </Link>
        ))}
      </div>
      <h2 className='prompt' style={{ marginTop: 32 }}>more</h2>
      <div className='grid'>
        {EXTRAS.map((x) => (
          <Link key={x.href} href={x.href} className='card' style={{ color: 'inherit' }}>
            <span className='tag'>{x.tag}</span><h3>{x.title}</h3><p className='dim'>{x.text}</p>
          </Link>
        ))}
      </div>
      <h2 className='prompt' style={{ marginTop: 32 }}>quickstart</h2>
      <pre>{QUICKSTART}</pre>
    </>
  )
}
