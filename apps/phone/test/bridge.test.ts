import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { bridgeCall } from '../src/bridge.js'

class FakeTwilio extends EventEmitter {
  sent: Array<Record<string, any>> = []
  send (d: string) { this.sent.push(JSON.parse(d)) }
  close = vi.fn()
  twilio (msg: object) { this.emit('message', Buffer.from(JSON.stringify(msg))) }
}

function fakeAgent () {
  let onEvent: (e: any) => void = () => {}
  const socket = { sendAudio: vi.fn(), close: vi.fn() }
  const connect = vi.fn(async (opts: { onEvent: (e: any) => void, tools: Record<string, Function> }) => { onEvent = opts.onEvent; return socket })
  return { connect, socket, agent: (e: any) => onEvent(e) }
}

const flush = () => new Promise((r) => setTimeout(r, 5))

describe('bridgeCall', () => {
  it('connects the preset agent on start and relays audio both ways', async () => {
    const tw = new FakeTwilio()
    const a = fakeAgent()
    const signedUrlFor = vi.fn(async () => 'wss://agent')
    bridgeCall(tw as never, { signedUrlFor, connect: a.connect as never, toolsFor: () => ({}), holdAudio: new Uint8Array(160) })
    tw.twilio({ event: 'start', start: { streamSid: 'MZ1', customParameters: { preset: 'navigator' } } })
    await flush()
    expect(signedUrlFor).toHaveBeenCalledWith('navigator')
    tw.twilio({ event: 'media', media: { payload: 'AAAA' } })
    expect(a.socket.sendAudio).toHaveBeenCalledWith('AAAA')
    a.agent({ type: 'audio', base64: 'BBBB', eventId: 1 })
    expect(tw.sent).toContainEqual({ event: 'media', streamSid: 'MZ1', media: { payload: 'BBBB' } })
    a.agent({ type: 'interruption', eventId: 1 })
    expect(tw.sent).toContainEqual({ event: 'clear', streamSid: 'MZ1' })
  })

  it('buffers caller audio that arrives before the agent is connected', async () => {
    const tw = new FakeTwilio()
    const a = fakeAgent()
    bridgeCall(tw as never, { signedUrlFor: async () => 'wss://agent', connect: a.connect as never, toolsFor: () => ({}), holdAudio: new Uint8Array(160) })
    tw.twilio({ event: 'start', start: { streamSid: 'MZ1', customParameters: {} } })
    tw.twilio({ event: 'media', media: { payload: 'EARLY' } })
    await flush()
    expect(a.socket.sendAudio).toHaveBeenCalledWith('EARLY')
  })

  it('stops hold music as soon as the agent speaks again, and hangs up when the agent ends', async () => {
    const tw = new FakeTwilio()
    const a = fakeAgent()
    let hold: { start: () => void, stop: () => void } | undefined
    bridgeCall(tw as never, { signedUrlFor: async () => 'wss://agent', connect: a.connect as never, toolsFor: (h) => { hold = h; return {} }, holdAudio: new Uint8Array(160) })
    tw.twilio({ event: 'start', start: { streamSid: 'MZ1', customParameters: { preset: 'hala' } } })
    await flush()
    hold!.start()
    a.agent({ type: 'audio', base64: 'CCCC', eventId: 2 })
    const clearIdx = tw.sent.findIndex((m) => m.event === 'clear')
    const audioIdx = tw.sent.findIndex((m) => m.media?.payload === 'CCCC')
    expect(clearIdx).toBeGreaterThanOrEqual(0)
    expect(clearIdx).toBeLessThan(audioIdx)
    a.agent({ type: 'close' })
    expect(tw.close).toHaveBeenCalled()
    tw.emit('close')
    expect(a.socket.close).toHaveBeenCalled()
  })
})
