import { describe, expect, it, vi } from 'vitest'
import { createRateLimiter, sttRoute, tokenRoute, ttsRoute } from '../src/next/index.js'

const kit = {
  speak: vi.fn(async () => new Uint8Array([9])),
  transcribe: vi.fn(async () => ({ text: 'hello', language: 'en' })),
  conversationToken: vi.fn(async () => 'tok'),
  ensureAgent: vi.fn(async () => 'agent_auto')
}

const post = (body: unknown) => new Request('http://x/api', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' }, body: JSON.stringify(body)
})

describe('rate limiter', () => {
  it('blocks after the limit within the window', () => {
    let t = 0
    const limit = createRateLimiter({ max: 2, windowMs: 1000, now: () => t })
    expect([limit('a'), limit('a'), limit('a')]).toEqual([true, true, false])
    t = 1500
    expect(limit('a')).toBe(true)
  })
})

describe('ttsRoute', () => {
  const handler = ttsRoute({ kit: kit as never, maxChars: 10 })

  it('returns audio/mpeg', async () => {
    const res = await handler(post({ text: 'hi', language: 'en' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
  })

  it('validates input', async () => {
    expect((await handler(post({ text: '' }))).status).toBe(400)
    expect((await handler(post({ text: 'x'.repeat(11) }))).status).toBe(400)
  })

  it('maps upstream failures to 502', async () => {
    kit.speak.mockRejectedValueOnce(new Error('boom'))
    expect((await handler(post({ text: 'hi' }))).status).toBe(502)
  })
})

describe('tokenRoute', () => {
  it('uses the configured agent id for a preset', async () => {
    const handler = tokenRoute({ kit: kit as never, agentIds: { hala: 'agent_env' } })
    const res = await handler(new Request('http://x/api/token?preset=hala'))
    expect(await res.json()).toEqual({ token: 'tok', agentId: 'agent_env' })
  })

  it('auto-provisions when no id is configured and rejects unknown presets', async () => {
    const handler = tokenRoute({ kit: kit as never })
    expect(await (await handler(new Request('http://x/api/token?preset=navigator'))).json()).toMatchObject({ agentId: 'agent_auto' })
    expect((await handler(new Request('http://x/api/token?preset=nope'))).status).toBe(404)
  })

  it('returns 429 when rate limited', async () => {
    const handler = tokenRoute({ kit: kit as never, limiter: () => false })
    expect((await handler(new Request('http://x/api/token?preset=hala'))).status).toBe(429)
  })
})

describe('sttRoute', () => {
  const handler = sttRoute({ kit: kit as never, maxBytes: 4 })
  const form = (bytes: number) => {
    const fd = new FormData()
    fd.append('file', new Blob([new Uint8Array(bytes)]), 'a.webm')
    return new Request('http://x/api/stt', { method: 'POST', body: fd })
  }

  it('transcribes an uploaded file', async () => {
    expect(await (await handler(form(2))).json()).toEqual({ text: 'hello', language: 'en' })
  })

  it('rejects missing and oversized files', async () => {
    expect((await handler(new Request('http://x', { method: 'POST', body: new FormData() }))).status).toBe(400)
    expect((await handler(form(5))).status).toBe(413)
  })
})
