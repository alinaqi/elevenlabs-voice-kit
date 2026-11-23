/** Anything that can play "please hold" audio: a browser <audio>, a phone media stream, etc. */
export interface HoldController {
  start: () => void
  stop: () => void
}

/**
 * Run a slow task; if it takes longer than `thresholdMs`, play hold music until it settles.
 * Fast tasks never trigger music, and music always stops, even on failure.
 */
export async function withHold<T> (task: () => Promise<T>, hold: HoldController, { thresholdMs = 1200 } = {}): Promise<T> {
  let playing = false
  const timer = setTimeout(() => { playing = true; hold.start() }, thresholdMs)
  try {
    return await task()
  } finally {
    clearTimeout(timer)
    if (playing) hold.stop()
  }
}
