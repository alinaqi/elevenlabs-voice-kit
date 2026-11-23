const PRESET_BY_DIGIT: Record<string, string> = { 1: 'navigator', 2: 'soft-landing', 3: 'hala' }

export const presetForDigit = (digit?: string) => PRESET_BY_DIGIT[digit ?? ''] ?? 'hala'
const xml = (body: string) => `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`

/** Bilingual menu voiced by ElevenLabs (pre-generated MP3), keypad picks the agent. */
export function menuTwiml (baseUrl: string): string {
  return xml(`<Gather numDigits="1" action="${baseUrl}/twiml/route" method="POST" timeout="6">` +
    `<Play>${baseUrl}/audio/menu.mp3</Play></Gather><Redirect method="POST">${baseUrl}/twiml/route</Redirect>`)
}

/** Hand the call audio to our WebSocket bridge, tagging which preset agent to use. */
export function connectTwiml (baseUrl: string, preset: string): string {
  const wss = baseUrl.replace(/^http/, 'ws')
  return xml(`<Connect><Stream url="${wss}/media"><Parameter name="preset" value="${preset}"/></Stream></Connect>`)
}
