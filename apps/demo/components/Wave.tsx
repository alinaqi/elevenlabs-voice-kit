const BARS = Array.from({ length: 28 }, (_, i) => i)

/** The guide-cover waveform; animates while the agent speaks. */
export function Wave ({ on }: { on: boolean }) {
  return (
    <div className={`wave ${on ? 'on' : ''}`} aria-hidden>
      {BARS.map((i) => <span key={i} style={{ animationDelay: `${(i % 7) * 0.09}s`, height: on ? undefined : `${12 + Math.abs(Math.sin(i)) * 30}%` }} />)}
    </div>
  )
}
