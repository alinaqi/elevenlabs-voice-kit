/** Live smoke test against the real ElevenLabs API using only ELEVENLABS_API_KEY. */
import 'dotenv/config'
import { createVoiceKit, getPreset } from '../packages/voice-kit/src/index.js'

const kit = createVoiceKit()
const check = async (name: string, fn: () => Promise<string>) => {
  const t = Date.now()
  try { const out = await fn(); console.log(`✓ ${name} (${Date.now() - t}ms): ${out}`) } catch (e) { console.log(`✗ ${name}: ${(e as Error).message}`); process.exitCode = 1 }
}

await check('tts en', async () => `${(await kit.speak('Welcome to Dubai Silicon Oasis.')).length} bytes`)
let arabic = new Uint8Array()
await check('tts ar', async () => { arabic = await kit.speak('مرحبا بكم في واحة دبي للسيليكون', { language: 'ar' }); return `${arabic.length} bytes` })
await check('stt ar round-trip', async () => JSON.stringify(await kit.transcribe(new Blob([arabic as BlobPart], { type: 'audio/mpeg' }))))
await check('voices', async () => (await kit.listVoices()).slice(0, 3).map((v) => v.name).join(', '))
for (const id of ['navigator', 'soft-landing', 'hala', 'assistant']) {
  await check(`agent ${id}`, async () => kit.ensureAgent(getPreset(id)!))
}
await check('token hala', async () => `${(await kit.conversationToken(await kit.ensureAgent(getPreset('hala')!))).slice(0, 12)}…`)
