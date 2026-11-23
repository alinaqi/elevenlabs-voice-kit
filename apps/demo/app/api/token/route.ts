import { tokenRoute } from '@workhub/voice-kit/next'
import { agentIds, getKit } from '@/lib/server'

export const GET = (req: Request) => tokenRoute({ kit: getKit(), agentIds })(req)
