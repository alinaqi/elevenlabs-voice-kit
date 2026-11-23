import type { ElevenLabs } from '@elevenlabs/elevenlabs-js'
import { DEFAULT_LLM, DEFAULT_VOICE_ID, pickTtsModel } from '../languages.js'
import { toElevenTool } from '../tools/define.js'
import type { ResolvedPreset } from './types.js'

export const agentName = (p: ResolvedPreset) => `voice-kit · ${p.name}`
export const agentTag = (p: ResolvedPreset) => `voice-kit:${p.id}`

const VOICE_RULES = `
# Voice rules
- You are speaking out loud. Short answers first (1-2 sentences); give details only when asked.
- Always reply in the language of the user's LATEST message. If they switch language mid-conversation, call language_detection to switch your voice, then answer in the new language.
- Never invent facts, prices or times. If something is not in your knowledge, call research_fact (if available) or hand over to a human.
- Before a tool that may take a while, tell the user briefly what you are doing.`

function prompt (p: ResolvedPreset): string {
  const facts = p.knowledge.length ? `\n# Knowledge\n${p.knowledge.map((k) => `- ${k}`).join('\n')}` : ''
  return `${p.systemPrompt.trim()}\n${VOICE_RULES}${facts}`
}

function systemTool (name: string, systemToolType: string) {
  return { name, params: { systemToolType } } as unknown as ElevenLabs.SystemToolConfigInput
}

/**
 * ElevenLabs forces English-primary agents onto the English-only TTS model, which garbles Arabic.
 * So a multilingual preset uses its first non-English language as the base (multilingual model) and
 * greets in every language at once; English becomes a language preset.
 */
function primaryLanguage (p: ResolvedPreset) {
  return p.languages.find((l) => l !== 'en') ?? p.languages[0]
}

function greeting (p: ResolvedPreset) {
  return p.greeting ?? p.languages.map((l) => p.firstMessage[l]).join(' ')
}

function languagePresets (p: ResolvedPreset) {
  const others = p.languages.filter((l) => l !== primaryLanguage(p))
  return Object.fromEntries(others.map((l) => [l, { overrides: { agent: { language: l, firstMessage: p.firstMessage[l] } } }]))
}

/** Turn a preset into the request body for `conversationalAi.agents.create/update`. */
export function buildAgentConfig (p: ResolvedPreset) {
  const multilingual = p.languages.length > 1
  const conversationConfig = {
    agent: {
      language: primaryLanguage(p),
      firstMessage: greeting(p),
      prompt: {
        prompt: prompt(p),
        llm: p.llm ?? DEFAULT_LLM,
        tools: p.tools.map(toElevenTool),
        builtInTools: {
          endCall: systemTool('end_call', 'end_call'),
          ...(multilingual ? { languageDetection: systemTool('language_detection', 'language_detection') } : {})
        }
      }
    },
    tts: { modelId: pickTtsModel([primaryLanguage(p)]), voiceId: p.voiceId ?? DEFAULT_VOICE_ID },
    conversation: { maxDurationSeconds: p.maxDurationSeconds },
    languagePresets: languagePresets(p)
  }
  return { name: agentName(p), tags: [agentTag(p), 'voice-kit'], conversationConfig }
}

export type AgentConfigBody = ReturnType<typeof buildAgentConfig>
