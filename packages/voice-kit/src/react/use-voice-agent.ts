'use client'
import { useConversation } from '@elevenlabs/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createMockCalendar } from '../tools/calendar.js'
import { createDemoToolHandlers, type ResearchAnswer, type ToolEvent, type ToolHandlers } from '../tools/handlers.js'
import { browserHold } from './hold-audio.js'

export interface VoiceAgentOptions {
  /** Built-in preset id (navigator, soft-landing, hala, assistant). */
  preset: string
  tokenUrl?: string
  researchUrl?: string
  holdMusicUrl?: string
  /** Extra or replacement tool handlers for your own tools. */
  tools?: ToolHandlers
  language?: string
}

export interface ChatLine { role: 'user' | 'agent', text: string }

async function postJson<T> (url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  return await res.json() as T
}

function useHandlers (opts: VoiceAgentOptions, onEvent: (e: ToolEvent) => void, setOnHold: (v: boolean) => void) {
  return useMemo(() => {
    const music = browserHold(opts.holdMusicUrl ?? '/hold-music.mp3')
    const hold = { start: () => { setOnHold(true); music.start() }, stop: () => { setOnHold(false); music.stop() } }
    const research = (question: string) => postJson<ResearchAnswer>(opts.researchUrl ?? '/api/research', { question })
    const demo = createDemoToolHandlers({ calendar: createMockCalendar(), research, hold, onEvent })
    return { ...demo, ...opts.tools }
  }, [opts.holdMusicUrl, opts.researchUrl, opts.tools, onEvent, setOnHold])
}

/** Talk to a preset agent: token fetch, client tools, transcript, tool events and hold music — wired up. */
export function useVoiceAgent (opts: VoiceAgentOptions) {
  const [lines, setLines] = useState<ChatLine[]>([])
  const [events, setEvents] = useState<ToolEvent[]>([])
  const [onHold, setOnHold] = useState(false)
  const onEvent = useCallback((e: ToolEvent) => setEvents((prev) => [...prev, e]), [])
  const clientTools = useHandlers(opts, onEvent, setOnHold)
  const conversation = useConversation({
    clientTools,
    onMessage: ({ message, source }: { message: string, source: string }) =>
      setLines((prev) => [...prev, { role: source === 'user' ? 'user' : 'agent', text: message }])
  } as never)
  const agentId = useRef<string | undefined>(undefined)

  const start = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    const res = await fetch(`${opts.tokenUrl ?? '/api/token'}?preset=${encodeURIComponent(opts.preset)}`)
    if (!res.ok) throw new Error(`token ${res.status}`)
    const { token, agentId: id } = await res.json() as { token: string, agentId: string }
    agentId.current = id
    setLines([]); setEvents([])
    const overrides = opts.language ? { agent: { language: opts.language } } : undefined
    conversation.startSession({ conversationToken: token, connectionType: 'webrtc', overrides } as never)
  }, [conversation, opts.preset, opts.tokenUrl, opts.language])

  return { ...conversation, start, stop: conversation.endSession, lines, events, onHold, agentId }
}
