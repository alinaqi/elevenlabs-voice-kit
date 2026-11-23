import { BUNDLED_FACTS } from '../data/facts.js'
import type { ResearchAnswer } from '../tools/handlers.js'

export interface Fact { question: string, answer: string, sources: string[] }

export interface ResearchClientOptions {
  /** Hosted research service (pydantic-ai + web search). The kit's public instance is used by default. */
  url?: string
  /** Pre-researched facts answered instantly, without a network call. Defaults to the bundled hackathon facts. */
  facts?: Fact[]
  fetchFn?: typeof fetch
  timeoutMs?: number
}

export const DEFAULT_RESEARCH_URL = 'https://voice-kit-research.vercel.app'
const STOP = new Set(['what', 'which', 'when', 'where', 'who', 'how', 'is', 'are', 'the', 'a', 'an', 'for', 'of', 'to', 'in', 'do', 'does', 'and', 'on', 'at', 'go', 'there',
  // place names alone are not a match
  'dubai', 'silicon', 'oasis', 'dso', 'uae', 'can', 'my', 'me', 'get', 'closest', 'nearest'])

const words = (s: string) => new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w)))
const stem = (w: string) => /(ss|sh|ch|x|z|us)es$/.test(w) ? w.slice(0, -2) : w.replace(/(?<![su]|i)s$/, '')

/** Keyword-overlap lookup; good enough for a few hundred prefetched facts. */
export function matchFact (question: string, facts: Fact[], threshold = 0.5): Fact | undefined {
  const q = [...words(question)].map(stem)
  if (!q.length) return undefined
  const score = (f: Fact) => { const fw = new Set([...words(f.question)].map(stem)); return q.filter((w) => fw.has(w)).length / q.length }
  const best = facts.map((f) => ({ f, s: score(f) })).sort((a, b) => b.s - a.s)[0]
  return best && best.s >= threshold ? best.f : undefined
}

export function createResearchClient (opts: ResearchClientOptions = {}) {
  const { url = globalThis.process?.env?.VOICE_KIT_RESEARCH_URL ?? DEFAULT_RESEARCH_URL, facts = BUNDLED_FACTS, fetchFn = fetch, timeoutMs = 25000 } = opts
  return async function research (question: string): Promise<ResearchAnswer> {
    const hit = matchFact(question, facts)
    if (hit) return { answer: hit.answer, sources: hit.sources, cached: true }
    try {
      const res = await fetchFn(`${url}/research`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }), signal: AbortSignal.timeout(timeoutMs)
      })
      if (!res.ok) throw new Error(`research ${res.status}`)
      const body = await res.json() as { answer: string, sources: string[] }
      return { answer: body.answer, sources: body.sources ?? [], cached: false }
    } catch {
      return { answer: 'I could not verify that right now. A human adviser should confirm it.', sources: [], cached: false }
    }
  }
}
