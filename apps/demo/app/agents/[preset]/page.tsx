import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AgentConsole } from '@/components/AgentConsole'
import { CHALLENGES, getChallenge } from '@/lib/challenges'

export const generateStaticParams = () => CHALLENGES.map((c) => ({ preset: c.id }))

export default async function AgentPage ({ params }: { params: Promise<{ preset: string }> }) {
  const challenge = getChallenge((await params).preset)
  if (!challenge) notFound()
  return (
    <>
      <div className='row' style={{ marginBottom: 8 }}>
        {CHALLENGES.map((c) => <Link key={c.id} href={`/agents/${c.id}`} className={`tag ${c.id === challenge.id ? 'live' : ''}`}>{c.code} {c.title}</Link>)}
      </div>
      <h1 style={{ fontSize: 40 }}>{challenge.title}</h1>
      <p className='dim'>{challenge.pitch}</p>
      <div className='row' style={{ margin: '8px 0 20px' }}>{challenge.mustHave.map((m) => <span key={m} className='tag'>✓ {m}</span>)}</div>
      <AgentConsole challenge={challenge} />
      <p className='dim' style={{ marginTop: 16, fontSize: 12 }}>
        Bookings use a mock calendar; fees and processing times are demo values. Agent: <code>preset: &apos;{challenge.id}&apos;</code> in <Link href='/build'>@workhub/voice-kit</Link>.
      </p>
    </>
  )
}
