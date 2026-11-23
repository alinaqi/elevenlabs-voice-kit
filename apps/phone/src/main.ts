import { readFileSync } from 'node:fs'
import {
  connectAgent, createDemoToolHandlers, createMockCalendar, createResearchClient, createVoiceKit, getPreset
} from '@workhub/voice-kit'
import { bridgeCall } from './bridge.js'
import { createPhoneServer } from './server.js'

const MENU = [
  { text: 'Welcome to Voice of the Oasis. For directions, press 1. To set up a company, press 2. For DSO services, press 3.', language: 'en' as const },
  { text: 'أهلاً بكم في صوت الواحة. للاتجاهات اضغط واحد. لتأسيس شركة اضغط اثنين. لخدمات واحة دبي للسيليكون اضغط ثلاثة.', language: 'ar' as const }
]

const kit = createVoiceKit()
const calendar = createMockCalendar()
const research = createResearchClient()
const holdAudio = new Uint8Array(readFileSync(new URL('../assets/hold-music.ulaw', import.meta.url)))
const publicUrl = () => (process.env.PUBLIC_BASE_URL ?? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`).replace(/\/$/, '')

let menu: Promise<Uint8Array> | undefined
const menuAudio = () => (menu ??= Promise.all(MENU.map((m) => kit.speak(m.text, { language: m.language })))
  .then((parts) => Buffer.concat(parts)))

async function signedUrlFor (presetId: string) {
  const preset = getPreset(presetId) ?? getPreset('hala')!
  return kit.signedUrl(await kit.ensureAgent(preset, 'phone'))
}

const server = createPhoneServer({
  publicUrl,
  authToken: process.env.TWILIO_VALIDATE_SIGNATURE === 'false' ? undefined : process.env.TWILIO_AUTH_TOKEN,
  menuAudio,
  onMediaSocket: (ws) => bridgeCall(ws, {
    signedUrlFor,
    connect: connectAgent,
    toolsFor: (hold, preset) => createDemoToolHandlers({
      calendar,
      research,
      hold: { start: () => { console.log(`[${preset}] ♪ hold on`); hold.start() }, stop: () => { console.log(`[${preset}] ♪ hold off`); hold.stop() } },
      onEvent: (e) => console.log(`[${preset}] ${e.type}`)
    }),
    holdAudio
  })
})

const port = Number(process.env.PORT ?? 3010)
server.listen(port, () => {
  console.log(`[phone] listening on ${port}, public ${publicUrl()}`)
  void menuAudio().then(() => console.log('[phone] menu audio ready'))
})
