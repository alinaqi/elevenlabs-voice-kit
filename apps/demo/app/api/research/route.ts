import { researchRoute } from '@workhub/voice-kit/next'
import { research } from '@/lib/server'

export const maxDuration = 60
export const POST = researchRoute({ research })
