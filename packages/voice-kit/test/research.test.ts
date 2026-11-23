import { describe, expect, it, vi } from 'vitest'
import { createResearchClient, matchFact } from '../src/server/research.js'
import { pcm16ToMulaw } from '../src/audio/mulaw.js'

const facts = [
  { question: 'What is the minimum share capital for a DSO company?', answer: 'Sources disagree: AED 100,000 vs AED 1.', sources: ['dso.ae'] },
  { question: 'Which bus routes serve Dubai Silicon Oasis?', answer: 'Routes 50, 320, 365, 366 and X25.', sources: ['rta.ae'] }
]

describe('matchFact', () => {
  it('matches a paraphrased question by keyword overlap', () => {
    expect(matchFact('what buses go to silicon oasis', facts)?.answer).toContain('X25')
    expect(matchFact('weather in paris', facts)).toBeUndefined()
    expect(matchFact('Which metro station is closest to Dubai Silicon Oasis?', facts)).toBeUndefined()
  })
})

describe('createResearchClient', () => {
  it('ships pre-researched hackathon facts by default (works with zero config)', async () => {
    const research = createResearchClient({ fetchFn: vi.fn() })
    expect((await research('Which bus routes serve DSO?')).cached).toBe(true)
  })

  it('answers instantly from prefetched facts', async () => {
    const fetchFn = vi.fn()
    const research = createResearchClient({ url: 'https://r.example', facts, fetchFn })
    const a = await research('minimum share capital for a DSO company?')
    expect(a).toMatchObject({ cached: true })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('calls the hosted research service on a miss', async () => {
    const fetchFn = vi.fn(async () => Response.json({ answer: 'Dtec opened in 2018', sources: ['dtec.ae'] }))
    const research = createResearchClient({ url: 'https://r.example', facts, fetchFn })
    expect(await research('when did dtec open?')).toEqual({ answer: 'Dtec opened in 2018', sources: ['dtec.ae'], cached: false })
    expect((fetchFn.mock.calls[0] as unknown as [string])[0]).toBe('https://r.example/research')
  })

  it('degrades gracefully when the service fails', async () => {
    const research = createResearchClient({ url: 'https://r.example', facts, fetchFn: async () => new Response('x', { status: 500 }) })
    expect((await research('when did dtec open?')).answer).toMatch(/could not verify/i)
  })
})

describe('pcm16ToMulaw', () => {
  it('encodes silence and extremes per G.711', () => {
    const pcm = new Int16Array([0, 32767, -32768])
    expect(Array.from(pcm16ToMulaw(new Uint8Array(pcm.buffer)))).toEqual([0xff, 0x80, 0x00])
  })
})
