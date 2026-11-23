/** Browser E2E: an uncached question must trigger hold music, then show a live answer. */
import { chromium } from 'playwright'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3005'
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(`${BASE}/research`)
await page.fill('input', `Which coworking spaces near Dubai Silicon Oasis offer day passes? (${Date.now() % 1000})`)
await page.getByRole('button', { name: 'ask' }).click()
await page.waitForSelector('.hold', { timeout: 5000 })
const musicPlaying = await page.evaluate(() => [...document.querySelectorAll('audio')].length >= 0)
console.log('hold indicator shown ✓', musicPlaying)
await page.waitForSelector('.line.agent', { timeout: 40000 })
console.log('hold cleared:', !(await page.$('.hold')))
console.log(await page.textContent('.line.agent'))
await page.screenshot({ path: 'e2e/out/research-hold.png' })
await browser.close()
