import { createRateLimiter, clientIp } from '@workhub/voice-kit/next'
import { getPreset } from '@workhub/voice-kit/presets'
import { AVATAR_MAX_SECONDS, avatarConfigured, avatarUrl } from '@/lib/live-avatar'
import { getKit } from '@/lib/server'

const limiter = createRateLimiter({ max: 5, windowMs: 60000 })

/** GET /api/avatar?preset=hala → { url, maxSeconds } */
export async function GET (req: Request) {
  if (!avatarConfigured()) return Response.json({ error: 'Avatar add-on not configured' }, { status: 501 })
  if (!limiter(clientIp(req))) return Response.json({ error: 'Too many requests' }, { status: 429 })
  const preset = getPreset(new URL(req.url).searchParams.get('preset') ?? 'hala')
  if (!preset) return Response.json({ error: 'Unknown preset' }, { status: 404 })
  try {
    const agentId = await getKit().ensureAgent(preset, 'avatar')
    return Response.json({ url: await avatarUrl(agentId, 'en'), maxSeconds: AVATAR_MAX_SECONDS })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
