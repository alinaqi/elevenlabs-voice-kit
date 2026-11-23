import { createHmac } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPhoneServer } from '../src/server.js'

let base = ''
const server = createPhoneServer({
  publicUrl: () => 'https://p.example',
  authToken: 'tok',
  menuAudio: async () => new Uint8Array([1, 2, 3]),
  onMediaSocket: () => {}
})

beforeAll(async () => { await new Promise<void>((r) => server.listen(0, r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}` })
afterAll(() => { server.close() })

const signed = (path: string, params: Record<string, string>) => {
  const sig = createHmac('sha1', 'tok').update('https://p.example' + path + Object.keys(params).sort().map((k) => k + params[k]).join('')).digest('base64')
  return fetch(base + path, { method: 'POST', headers: { 'x-twilio-signature': sig, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) })
}

describe('phone server', () => {
  it('serves health and the menu audio', async () => {
    expect((await fetch(base + '/health')).status).toBe(200)
    const audio = await fetch(base + '/audio/menu.mp3')
    expect(audio.headers.get('content-type')).toBe('audio/mpeg')
    expect(new Uint8Array(await audio.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('returns the menu for a signed Twilio webhook and rejects unsigned ones', async () => {
    const ok = await signed('/twiml', { CallSid: 'CA1' })
    expect(await ok.text()).toContain('<Gather')
    expect((await fetch(base + '/twiml', { method: 'POST', body: 'CallSid=CA1' })).status).toBe(403)
  })

  it('routes the keypad digit to the matching agent', async () => {
    expect(await (await signed('/twiml/route', { Digits: '2' })).text()).toContain('value="soft-landing"')
  })

  it('404s unknown paths', async () => {
    expect((await fetch(base + '/nope')).status).toBe(404)
  })
})
