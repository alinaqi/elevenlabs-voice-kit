import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { phoneHold } from '../src/hold.js'

describe('phoneHold', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('streams 20ms μ-law frames in real time, looping, and clears on stop', () => {
    const frames: string[] = []
    const clear = vi.fn()
    const audio = new Uint8Array(400).map((_, i) => i % 256)
    const hold = phoneHold({ audio, sendFrame: (b64) => frames.push(b64), clear })
    hold.start()
    vi.advanceTimersByTime(100)
    expect(frames.length).toBe(5)
    expect(Buffer.from(frames[0], 'base64').length).toBe(160)
    expect(Buffer.from(frames[2], 'base64')[0]).toBe(audio[320])
    hold.stop()
    expect(clear).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(100)
    expect(frames.length).toBe(5)
  })

  it('ignores double start and stop when idle', () => {
    const clear = vi.fn()
    const hold = phoneHold({ audio: new Uint8Array(160), sendFrame: () => {}, clear })
    hold.stop()
    hold.start(); hold.start()
    hold.stop()
    expect(clear).toHaveBeenCalledOnce()
  })
})
