import type { Lang } from '../languages.js'
import type { ClientToolSpec } from '../tools/define.js'

export interface VoicePreset {
  id: string
  name: string
  description: string
  languages: Lang[]
  firstMessage: Partial<Record<Lang, string>>
  /** Short opening line for multilingual agents (defaults to every first message joined). */
  greeting?: string
  systemPrompt: string
  knowledge?: string[]
  tools?: ClientToolSpec[]
  voiceId?: string
  llm?: string
  maxDurationSeconds?: number
}

export type ResolvedPreset = Required<Omit<VoicePreset, 'voiceId' | 'llm' | 'greeting'>> & Pick<VoicePreset, 'voiceId' | 'llm' | 'greeting'>
