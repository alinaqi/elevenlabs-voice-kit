import type { ResolvedPreset, VoicePreset } from './types.js'

/** Validate a preset: every language needs a first message so the agent can greet in it. */
export function definePreset (preset: VoicePreset): ResolvedPreset {
  const missing = preset.languages.filter((l) => !preset.firstMessage[l])
  if (missing.length) throw new Error(`preset ${preset.id}: missing firstMessage for ${missing.join(', ')}`)
  return { knowledge: [], tools: [], maxDurationSeconds: 300, ...preset }
}
