/** Browser E2E for the avatar: load the LiveAvatar embed for a preset, press start, report errors and frames. */
import { chromium } from 'playwright'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3005'
const preset = process.argv[2] ?? 'hala'
const { url, error } = await (await fetch(`${BASE}/api/avatar?preset=${preset}`)).json() as { url?: string, error?: string }
if (!url) throw new Error(error)
console.log('embed', url)
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 600, height: 1000 } })
await page.context().grantPermissions(['microphone', 'camera'])
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`console.${m.type()}:`, m.text().slice(0, 300)) })
page.on('response', async (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url().slice(0, 140), (await r.text().catch(() => '')).slice(0, 300)) })
await page.goto(url)
await page.waitForTimeout(4000)
await page.screenshot({ path: 'e2e/out/avatar-1.png' })
const start = page.getByRole('button').first()
console.log('buttons:', await page.getByRole('button').allTextContents())
await start.click().catch((e) => console.log('click failed', e.message))
await page.waitForTimeout(15000)
await page.screenshot({ path: 'e2e/out/avatar-2.png' })
console.log('text:', (await page.textContent('body'))?.replace(/\s+/g, ' ').slice(0, 300))
await browser.close()
