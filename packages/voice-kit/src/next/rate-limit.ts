export interface RateLimitOptions { max: number, windowMs: number, now?: () => number }
export type Limiter = (key: string) => boolean

/** Best-effort per-instance fixed-window limiter. Use a shared store (Upstash/Redis) for strict limits. */
export function createRateLimiter ({ max, windowMs, now = Date.now }: RateLimitOptions): Limiter {
  const hits = new Map<string, { start: number, count: number }>()
  return (key) => {
    const t = now()
    const entry = hits.get(key)
    if (!entry || t - entry.start >= windowMs) { hits.set(key, { start: t, count: 1 }); return true }
    entry.count += 1
    return entry.count <= max
  }
}

export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
