import type { ToolEvent } from '@workhub/voice-kit/tools'

type Data = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function Body ({ type, d }: { type: string, d: Data }) {
  if (type === 'booking') return <>📅 <b>{d.action}</b> {d.ref}: {d.service} · {d.name} · {d.date} {d.time} · {d.contact}</>
  if (type === 'route') return <>🧭 <b>route sent</b> {d.place.name} — <a href={d.url} target='_blank' rel='noreferrer'>open map</a></>
  if (type === 'service') return <>🗂 <b>{d.name}</b> <span className='ar'>{d.nameAr}</span><br />docs: {d.documents.join(', ')}<br /><span className='dim'>demo fee AED {d.demoFeeAed} · ~{d.demoDays}d</span></>
  if (type === 'checklist') return <>✅ <b>{d.recommendation}</b><ul>{d.documents.map((x: string) => <li key={x}>{x}</li>)}</ul><span className='dim'>confirm with a human: {d.confirmWithHuman.join(' · ')}</span></>
  if (type === 'handover') return <>🧑‍💼 <b>handover</b> {d.reason}</>
  if (type === 'research') return <>🔎 <b>{d.cached ? 'prefetched fact' : 'live research'}</b> {d.answer}<br /><span className='dim'>{d.sources.join(' · ')}</span></>
  return <pre>{JSON.stringify(d, null, 1)}</pre>
}

export function EventCard ({ event }: { event: ToolEvent }) {
  return <div className='event'><Body type={event.type} d={event.data as Data} /></div>
}
