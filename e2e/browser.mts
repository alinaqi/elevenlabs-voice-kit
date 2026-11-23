/** Browser E2E: headless Chromium with a fake mic that "speaks" a WAV file to the live agent. */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { createVoiceKit } from '../packages/voice-kit/src/index.js'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3005'
const OUT = 'e2e/out'
mkdirSync(OUT, { recursive: true })

async function micWav (text: string, lang: 'en' | 'ar') {
  const mp3 = await createVoiceKit().speak(text, { language: lang })
  writeFileSync(`${OUT}/q.mp3`, mp3)
  // 6 s silence (let the greeting play), the question, then 20 s silence. Chrome loops the file.
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-t', '6', '-i', 'anullsrc=r=16000:cl=mono', '-i', `${OUT}/q.mp3`, '-f', 'lavfi', '-t', '20', '-i', 'anullsrc=r=16000:cl=mono',
    '-filter_complex', '[1:a]aresample=16000,aformat=channel_layouts=mono[q];[0:a][q][2:a]concat=n=3:v=0:a=1', '-ac', '1', '-ar', '16000', `${OUT}/mic.wav`])
  return `${OUT}/mic.wav`
}

const preset = process.argv[2] ?? 'hala'
const question = process.argv[3] ?? 'Hello, I need to renew my employee visa. What documents do I need?'
const wav = await micWav(question, /[؀-ۿ]/.test(question) ? 'ar' : 'en')
const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`, '--autoplay-policy=no-user-gesture-required']
})
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
await page.context().grantPermissions(['microphone'], { origin: BASE })
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 200)) })
await page.goto(`${BASE}/agents/${preset}`)
await page.getByRole('button', { name: /start talking/ }).click()
await page.waitForSelector('.line.agent', { timeout: 20000 })
await page.waitForSelector('.line.user', { timeout: 40000 })
await page.waitForFunction(() => document.querySelectorAll('.line.agent').length >= 2, null, { timeout: 40000 })
await page.waitForTimeout(6000)
const lines = await page.$$eval('.line', (els) => els.map((e) => e.textContent))
const events = await page.$$eval('.event', (els) => els.map((e) => e.textContent?.slice(0, 120)))
await page.screenshot({ path: `${OUT}/agent-${preset}.png`, fullPage: true })
console.log({ lines, events })
await page.getByRole('button', { name: /end/ }).click()
await browser.close()
