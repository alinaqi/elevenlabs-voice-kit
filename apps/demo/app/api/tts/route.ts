import { ttsRoute } from '@workhub/voice-kit/next'
import { getKit } from '@/lib/server'

let handler: ((req: Request) => Promise<Response>) | undefined
export const POST = (req: Request) => (handler ??= ttsRoute({ kit: getKit(), maxChars: 600 }))(req)
