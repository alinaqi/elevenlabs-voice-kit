import type { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { DEFAULT_VOICE_ID, pickTtsModel, type Lang } from '../languages.js'
import { readAll } from './stream.js'

export const MAX_TTS_CHARS = 5000

export interface SpeakOptions { voiceId?: string, language?: Lang, modelId?: string, format?: string }
export interface Transcript { text: string, language: string }
export interface VoiceInfo { id: string, name: string, accent?: string, previewUrl?: string }

type Client = Pick<ElevenLabsClient, 'textToSpeech' | 'speechToText' | 'voices' | 'music'>

export function speechApi (client: Client) {
  async function speak (text: string, opts: SpeakOptions = {}): Promise<Uint8Array> {
    if (!text.trim() || text.length > MAX_TTS_CHARS) throw new Error(`text must be 1-${MAX_TTS_CHARS} characters`)
    const language = opts.language ?? 'en'
    const stream = await client.textToSpeech.convert(opts.voiceId ?? DEFAULT_VOICE_ID, {
      text,
      modelId: opts.modelId ?? pickTtsModel([language]),
      languageCode: language,
      outputFormat: (opts.format ?? 'mp3_44100_128') as never
    })
    return readAll(stream)
  }

  async function transcribe (audio: Blob, language?: string): Promise<Transcript> {
    const res = await client.speechToText.convert({ file: audio, modelId: 'scribe_v1', languageCode: language }) as { text?: string, languageCode?: string }
    return { text: res.text ?? '', language: res.languageCode ?? language ?? '' }
  }

  async function listVoices (search?: string): Promise<VoiceInfo[]> {
    const res = await client.voices.search({ search, pageSize: 50 })
    return res.voices.map((v) => ({ id: v.voiceId, name: v.name ?? v.voiceId, accent: v.labels?.accent, previewUrl: v.previewUrl ?? undefined }))
  }

  /** Generate instrumental music (e.g. hold music) with ElevenLabs Music. */
  async function composeMusic (prompt: string, { lengthMs = 30000, format = 'mp3_44100_128' } = {}): Promise<Uint8Array> {
    const stream = await client.music.compose({ prompt, musicLengthMs: lengthMs, forceInstrumental: true, outputFormat: format as never })
    return readAll(stream)
  }

  return { speak, transcribe, listVoices, composeMusic }
}
