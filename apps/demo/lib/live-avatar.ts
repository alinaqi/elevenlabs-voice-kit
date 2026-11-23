import 'server-only'
import { z } from 'zod'

/**
 * Optional talking-head add-on (ported from hisers). The ElevenLabs agent talks; LiveAvatar renders a face
 * driven by that audio inside an iframe. Needs LIVEAVATAR_API_KEY + LIVEAVATAR_AVATAR_ID on top of ElevenLabs.
 *   1. POST /v1/secrets      store our ElevenLabs key at LiveAvatar (find-or-create by name)
 *   2. POST /v1/voice_agents bind the ElevenLabs agent
 *   3. POST /v2/embeddings   bind that voice agent to a face → embed URL
 */
const API = 'https://api.liveavatar.com'
const SECRET_NAME = 'voice-kit-elevenlabs'
const MAX_SESSION_SECONDS = 120

const created = z.object({ id: z.string() })
const ids = z.array(z.string()).min(1)

class Conflict extends Error { constructor (readonly data: unknown) { super('exists') } }

export const avatarConfigured = () => Boolean(process.env.LIVEAVATAR_API_KEY && process.env.LIVEAVATAR_AVATAR_ID)

async function call (method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(API + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: { 'X-API-KEY': process.env.LIVEAVATAR_API_KEY ?? '', 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  })
  const json = await res.json().catch(() => null) as { data?: unknown } | null
  if (res.status === 409) throw new Conflict(json?.data)
  if (!res.ok) throw new Error(`LiveAvatar ${path} ${res.status}`)
  return json?.data ?? json
}

let secret: Promise<string> | undefined
function secretId (): Promise<string> {
  secret ??= (async () => {
    const list = z.array(z.object({ id: z.string(), secret_name: z.string() })).safeParse(await call('GET', '/v1/secrets'))
    const mine = list.success ? list.data.find((s) => s.secret_name === SECRET_NAME) : undefined
    if (mine) return mine.id
    const body = { secret_type: 'ELEVENLABS_API_KEY', secret_name: SECRET_NAME, secret_value: process.env.ELEVENLABS_API_KEY }
    return created.parse(await call('POST', '/v1/secrets', body)).id
  })().catch((e: unknown) => { secret = undefined; throw e })
  return secret
}

async function voiceAgent (agentId: string): Promise<string> {
  const body = { name: `voice-kit-${agentId}`, agent_type: 'elevenlabs_agent', agent_configuration: { agent_id: agentId, secret_id: await secretId() } }
  try { return created.parse(await call('POST', '/v1/voice_agents', body)).id } catch (e) {
    if (e instanceof Conflict) return ids.parse(e.data)[0]
    throw e
  }
}

async function embed (voiceAgentId: string, language: string): Promise<string> {
  const body = { avatar_id: process.env.LIVEAVATAR_AVATAR_ID, voice_agent_id: voiceAgentId, default_language: language, orientation: 'vertical', max_session_duration: MAX_SESSION_SECONDS }
  try { return z.object({ url: z.string().url() }).parse(await call('POST', '/v2/embeddings', body)).url } catch (e) {
    if (!(e instanceof Conflict)) throw e
    const detail = z.object({ url: z.string().url(), orientation: z.string().optional() }).parse(await call('GET', `/v1/embeddings/${ids.parse(e.data)[0]}`))
    return detail.orientation ? `${detail.url}?orientation=${detail.orientation}` : detail.url
  }
}

const embeds = new Map<string, Promise<string>>()
/** Embed URL for an ElevenLabs agent (cached per agent + language). */
export function avatarUrl (agentId: string, language = 'en'): Promise<string> {
  const key = `${agentId}:${language}`
  if (!embeds.has(key)) embeds.set(key, voiceAgent(agentId).then((v) => embed(v, language)).catch((e: unknown) => { embeds.delete(key); throw e }))
  return embeds.get(key)!
}

export const AVATAR_MAX_SECONDS = MAX_SESSION_SECONDS
