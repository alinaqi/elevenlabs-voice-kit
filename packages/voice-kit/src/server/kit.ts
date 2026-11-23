import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { agentsApi } from './agents.js'
import { speechApi } from './speech.js'

export interface VoiceKitOptions {
  /** Defaults to process.env.ELEVENLABS_API_KEY — the only key the kit needs. */
  apiKey?: string
  /** Inject a pre-built client (tests, custom base URL). */
  client?: ElevenLabsClient
}

/** One call, one key: TTS, STT, voices, music, voice agents and tokens. */
export function createVoiceKit (opts: VoiceKitOptions = {}) {
  const apiKey = opts.apiKey ?? process.env.ELEVENLABS_API_KEY
  if (!opts.client && !apiKey) throw new Error('Set ELEVENLABS_API_KEY (or pass { apiKey }) — it is the only key you need.')
  const client = opts.client ?? new ElevenLabsClient({ apiKey })
  return { client, ...speechApi(client), ...agentsApi(client) }
}

export type VoiceKit = ReturnType<typeof createVoiceKit>
