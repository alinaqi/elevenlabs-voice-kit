import type { HoldController } from '@workhub/voice-kit'

const FRAME_BYTES = 160 // 20 ms of 8 kHz μ-law

export interface PhoneHoldOptions {
  audio: Uint8Array
  sendFrame: (base64: string) => void
  clear: () => void
}

/** Stream looping μ-law hold music into a Twilio call at real-time pace; `stop` flushes what Twilio buffered. */
export function phoneHold ({ audio, sendFrame, clear }: PhoneHoldOptions): HoldController & { playing: () => boolean } {
  let timer: NodeJS.Timeout | undefined
  let offset = 0
  const tick = () => {
    const frame = new Uint8Array(FRAME_BYTES).map((_, i) => audio[(offset + i) % audio.length])
    offset = (offset + FRAME_BYTES) % audio.length
    sendFrame(Buffer.from(frame).toString('base64'))
  }
  return {
    start () { timer ??= setInterval(tick, 20) },
    stop () {
      if (!timer) return
      clearInterval(timer)
      timer = undefined
      clear()
    },
    playing: () => Boolean(timer)
  }
}
