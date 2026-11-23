import { sttRoute } from '@workhub/voice-kit/next'
import { getKit } from '@/lib/server'

let handler: ((req: Request) => Promise<Response>) | undefined
export const POST = (req: Request) => (handler ??= sttRoute({ kit: getKit(), maxBytes: 8_000_000 }))(req)
