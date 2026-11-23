import type { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { buildAgentConfig, type AgentConfigBody } from '../presets/build.js'
import type { ResolvedPreset } from '../presets/types.js'

type Client = Pick<ElevenLabsClient, 'conversationalAi'>
export type Channel = 'web' | 'phone' | 'avatar'

const AVATAR_NOTE = '\n# Avatar mode\nYou are shown as a talking avatar and cannot book, send links or run tools here. Answer from your knowledge; for bookings, give the DSO number 600 59 55 57.'

/** The avatar embed runs the conversation itself, so browser tools cannot execute there. */
function avatarVariant (body: AgentConfigBody): AgentConfigBody {
  const cc = body.conversationConfig
  const prompt = { ...cc.agent.prompt, tools: [], prompt: cc.agent.prompt.prompt + AVATAR_NOTE }
  return {
    name: `${body.name} (avatar)`,
    tags: [...body.tags.map((t) => `${t}:avatar`), 'voice-kit'],
    // LiveAvatar lip-syncs from the agent's raw audio and only accepts 24 kHz PCM.
    conversationConfig: {
      ...cc,
      agent: { ...cc.agent, prompt },
      tts: { ...cc.tts, agentOutputAudioFormat: 'pcm_24000' },
      asr: { userInputAudioFormat: 'pcm_24000' }
    } as typeof cc
  }
}

/** Phone calls via Twilio need 8 kHz μ-law in and out; avatars cannot run tools; web uses the defaults. */
export function forChannel (body: AgentConfigBody, channel: Channel): AgentConfigBody {
  if (channel === 'web') return body
  if (channel === 'avatar') return avatarVariant(body)
  const cc = body.conversationConfig
  return {
    name: `${body.name} (phone)`,
    tags: [...body.tags.map((t) => `${t}:phone`), 'voice-kit'],
    conversationConfig: { ...cc, tts: { ...cc.tts, agentOutputAudioFormat: 'ulaw_8000' }, asr: { userInputAudioFormat: 'ulaw_8000' } } as typeof cc
  }
}

export function agentsApi (client: Client) {
  const agents = client.conversationalAi.agents
  const cache = new Map<string, string>()

  async function findByName (name: string): Promise<string | undefined> {
    const res = await agents.list({ search: name, pageSize: 100 })
    return res.agents.find((a) => a.name === name)?.agentId
  }

  /** Create the agent for a preset, or update it in place if it already exists (matched by exact name). */
  async function ensureAgent (preset: ResolvedPreset, channel: Channel = 'web'): Promise<string> {
    const body = forChannel(buildAgentConfig(preset), channel)
    const cached = cache.get(body.name)
    if (cached) return cached
    const existing = await findByName(body.name)
    if (existing) await agents.update(existing, body as never)
    const id = existing ?? (await agents.create(body as never)).agentId
    cache.set(body.name, id)
    return id
  }

  const conversations = client.conversationalAi.conversations
  const conversationToken = async (agentId: string) => (await conversations.getWebrtcToken({ agentId })).token
  const signedUrl = async (agentId: string) => (await conversations.getSignedUrl({ agentId })).signedUrl

  return { ensureAgent, conversationToken, signedUrl }
}
