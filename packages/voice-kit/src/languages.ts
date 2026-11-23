export type Lang = 'en' | 'ar' | 'fr' | 'es' | 'de' | 'hi' | 'ur' | 'zh' | 'ru' | 'pt'

/** A voice that speaks English and Arabic well on the multilingual flash model. */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'
export const DEFAULT_LLM = 'gemini-3.8-flash'

/** English-only agents can use the faster English model; anything else needs a multilingual one. */
export function pickTtsModel (languages: Lang[]): 'eleven_flash_v2' | 'eleven_flash_v2_5' {
  return languages.every((l) => l === 'en') ? 'eleven_flash_v2' : 'eleven_flash_v2_5'
}
