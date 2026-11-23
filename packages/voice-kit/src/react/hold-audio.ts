import type { HoldController } from '../tools/hold.js'

/** Looping hold music for the browser, with a short fade so it never clicks in or out. */
export function browserHold (url: string, volume = 0.35): HoldController & { playing: () => boolean } {
  let audio: HTMLAudioElement | undefined
  const fade = (to: number, done?: () => void) => {
    const el = audio
    if (!el) return
    const step = (to - el.volume) / 8
    let n = 0
    const id = setInterval(() => {
      el.volume = Math.min(1, Math.max(0, el.volume + step))
      if (++n >= 8) { clearInterval(id); done?.() }
    }, 40)
  }
  return {
    start () {
      audio ??= Object.assign(new Audio(url), { loop: true })
      audio.volume = 0
      void audio.play().catch(() => undefined)
      fade(volume)
    },
    stop () { fade(0, () => audio?.pause()) },
    playing: () => Boolean(audio && !audio.paused)
  }
}
