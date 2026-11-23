import { z } from 'zod'
import { getPreset } from '../presets/index.js'
import type { ResolvedPreset } from '../presets/types.js'
import type { VoiceKit } from '../server/kit.js'
import type { ResearchAnswer } from '../tools/handlers.js'
import { clientIp, createRateLimiter, type Limiter } from './rate-limit.js'

type Kit = Pick<VoiceKit, 'speak' | 'transcribe' | 'conversationToken' | 'ensureAgent'>
interface Base { kit: Kit, limiter?: Limiter }

const error = (status: number, message: string) => Response.json({ error: message }, { status })
const guard = (limiter: Limiter, req: Request) => limiter(clientIp(req)) ? undefined : error(429, 'Too many requests')

interface TokenOptions extends Base {
  /** Pin agent IDs per preset (e.g. from env); unpinned presets are auto-provisioned. */
  agentIds?: Record<string, string | undefined>
  /** Your own presets (from definePreset), looked up before the built-in ones. */
  presets?: Record<string, ResolvedPreset>
}

/** GET /api/token?preset=hala → { token, agentId }. Agent IDs come from env, else auto-provisioned. */
export function tokenRoute ({ kit, agentIds = {}, presets = {}, limiter = createRateLimiter({ max: 10, windowMs: 60000 }) }: TokenOptions) {
  return async (req: Request) => {
    const blocked = guard(limiter, req)
    if (blocked) return blocked
    const id = new URL(req.url).searchParams.get('preset') ?? 'assistant'
    const preset = Object.hasOwn(presets, id) ? presets[id] : getPreset(id)
    if (!preset) return error(404, `Unknown preset ${id}`)
    try {
      const agentId = agentIds[id] ?? await kit.ensureAgent(preset)
      return Response.json({ token: await kit.conversationToken(agentId), agentId })
    } catch (e) { return error(502, (e as Error).message) }
  }
}

const ttsBody = z.object({ text: z.string().trim().min(1), language: z.enum(['en', 'ar', 'fr', 'es', 'de', 'hi', 'ur', 'zh', 'ru', 'pt']).optional(), voiceId: z.string().optional() })

/** POST /api/tts { text, language?, voiceId? } → audio/mpeg */
export function ttsRoute ({ kit, maxChars = 600, limiter = createRateLimiter({ max: 20, windowMs: 60000 }) }: Base & { maxChars?: number }) {
  return async (req: Request) => {
    const blocked = guard(limiter, req)
    if (blocked) return blocked
    const parsed = ttsBody.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success || parsed.data.text.length > maxChars) return error(400, `text must be 1-${maxChars} characters`)
    try {
      const audio = await kit.speak(parsed.data.text, { language: parsed.data.language, voiceId: parsed.data.voiceId })
      return new Response(audio as BodyInit, { headers: { 'content-type': 'audio/mpeg' } })
    } catch (e) { return error(502, (e as Error).message) }
  }
}

/** POST /api/stt multipart { file } → { text, language } */
export function sttRoute ({ kit, maxBytes = 10_000_000, limiter = createRateLimiter({ max: 20, windowMs: 60000 }) }: Base & { maxBytes?: number }) {
  return async (req: Request) => {
    const blocked = guard(limiter, req)
    if (blocked) return blocked
    const file = (await req.formData().catch(() => undefined))?.get('file')
    if (!(file instanceof Blob)) return error(400, 'file is required')
    if (file.size > maxBytes) return error(413, 'file too large')
    try { return Response.json(await kit.transcribe(file)) } catch (e) { return error(502, (e as Error).message) }
  }
}

/** POST /api/research { question } → { answer, sources, cached } */
export function researchRoute ({ research, limiter = createRateLimiter({ max: 30, windowMs: 60000 }) }: { research: (q: string) => Promise<ResearchAnswer>, limiter?: Limiter }) {
  return async (req: Request) => {
    const blocked = guard(limiter, req)
    if (blocked) return blocked
    const parsed = z.object({ question: z.string().trim().min(3).max(500) }).safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return error(400, 'question must be 3-500 characters')
    return Response.json(await research(parsed.data.question))
  }
}
