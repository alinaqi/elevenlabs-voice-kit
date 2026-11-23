/** Acts as Twilio: streams spoken μ-law questions into the phone bridge and transcribes what the agent says back. */
import { execFileSync } from 'node:child_process'
import { WebSocket } from 'ws'
import { createVoiceKit } from '../packages/voice-kit/src/index.js'

const [preset = 'hala', ...questions] = process.argv.slice(2)
const kit = createVoiceKit()
const ws = new WebSocket(process.env.PHONE_WS ?? 'ws://127.0.0.1:3010/media')
let bucket: Buffer[] = []
let clears = 0
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  if (m.event === 'media') bucket.push(Buffer.from(m.media.payload, 'base64'))
  if (m.event === 'clear') clears++
})
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Like real Twilio: one 20 ms frame every 20 ms, forever — speech when we have it, μ-law silence (0xFF) otherwise.
let speech = Buffer.alloc(0)
const SILENCE = Buffer.alloc(160, 0xff)
setInterval(() => {
  if (ws.readyState !== WebSocket.OPEN) return
  const frame = speech.length ? speech.subarray(0, 160) : SILENCE
  speech = speech.subarray(160)
  ws.send(JSON.stringify({ event: 'media', media: { payload: frame.toString('base64') } }))
}, 20).unref()
async function stream (audio: Uint8Array) {
  speech = Buffer.from(audio)
  while (speech.length) await sleep(20)
}
async function heard (label: string) {
  const audio = Buffer.concat(bucket); bucket = []
  if (!audio.length) return console.log(`${label}: (silence)`)
  const mp3 = execFileSync('ffmpeg', ['-v', 'error', '-f', 'mulaw', '-ar', '8000', '-i', 'pipe:0', '-f', 'mp3', 'pipe:1'], { input: audio })
  const t = await kit.transcribe(new Blob([mp3], { type: 'audio/mpeg' }))
  console.log(`${label} [${(audio.length / 8000).toFixed(1)}s audio, clears=${clears}]: ${t.text}`)
}
await new Promise((r) => ws.on('open', r))
ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'MZsim', customParameters: { preset } } }))
await sleep(6000); await heard('AGENT')
for (const q of questions) {
  const lang = /[؀-ۿ]/.test(q) ? 'ar' : 'en'
  console.log(`CALLER (${lang}): ${q}`)
  await stream(await kit.speak(q, { language: lang, format: 'ulaw_8000' }))
  await sleep(Number(process.env.WAIT_MS ?? 12000)); await heard('AGENT')
}
ws.close()
process.exit(0)
