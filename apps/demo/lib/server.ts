import 'server-only'
import { createResearchClient, createVoiceKit, type VoiceKit } from '@workhub/voice-kit'

let kit: VoiceKit | undefined
/** Lazily created so `next build` works without secrets. Needs only ELEVENLABS_API_KEY. */
export const getKit = () => (kit ??= createVoiceKit())

export const research = createResearchClient()

/** Optional: pin agent IDs per preset (AGENT_ID_HALA=agent_…); otherwise they are auto-provisioned. */
export const agentIds: Record<string, string | undefined> = {
  navigator: process.env.AGENT_ID_NAVIGATOR,
  'soft-landing': process.env.AGENT_ID_SOFT_LANDING,
  hala: process.env.AGENT_ID_HALA,
  assistant: process.env.AGENT_ID_ASSISTANT
}

export const PHONE_NUMBER = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '+1 350 218 1012'
