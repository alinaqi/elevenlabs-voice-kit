import type { ToolHandlers } from '../tools/handlers.js'

/** Normalised events from an ElevenAgents conversation WebSocket. */
export type AgentEvent =
  | { type: 'metadata', conversationId: string, outputFormat?: string, inputFormat?: string }
  | { type: 'agent' | 'user', text: string }
  | { type: 'audio', base64: string, eventId: number }
  | { type: 'interruption', eventId: number }
  | { type: 'tool_call', name: string, params: Record<string, unknown> }
  | { type: 'close' }

interface WsLike { send: (d: string) => void, close: () => void, onopen?: unknown, onmessage?: unknown, onclose?: unknown, onerror?: unknown }
type WsCtor = new (url: string) => WsLike

export interface AgentSocketOptions {
  signedUrl: string
  tools?: ToolHandlers
  onEvent?: (e: AgentEvent) => void
  dynamicVariables?: Record<string, string>
  WebSocketImpl?: WsCtor
}

type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function toEvent (m: Raw): AgentEvent | undefined {
  switch (m.type) {
    case 'conversation_initiation_metadata': {
      const e = m.conversation_initiation_metadata_event
      return { type: 'metadata', conversationId: e.conversation_id, outputFormat: e.agent_output_audio_format, inputFormat: e.user_input_audio_format }
    }
    case 'agent_response': return { type: 'agent', text: m.agent_response_event.agent_response }
    case 'user_transcript': return { type: 'user', text: m.user_transcription_event.user_transcript }
    case 'audio': return { type: 'audio', base64: m.audio_event.audio_base_64, eventId: m.audio_event.event_id }
    case 'interruption': return { type: 'interruption', eventId: m.interruption_event.event_id }
    default: return undefined
  }
}

async function runTool (tools: ToolHandlers, call: Raw, send: (m: object) => void) {
  const handler = tools[call.tool_name]
  try {
    if (!handler) throw new Error(`unknown tool ${call.tool_name}`)
    send({ type: 'client_tool_result', tool_call_id: call.tool_call_id, result: await handler(call.parameters ?? {}), is_error: false })
  } catch (e) {
    send({ type: 'client_tool_result', tool_call_id: call.tool_call_id, result: (e as Error).message, is_error: true })
  }
}

/** Server-side conversation with an agent (phone bridges, tests, bots). Tools run here, not in a browser. */
export function connectAgent (opts: AgentSocketOptions) {
  const Impl = opts.WebSocketImpl ?? (globalThis.WebSocket as unknown as WsCtor)
  const ws = new Impl(opts.signedUrl)
  const listeners = new Set<(e: AgentEvent) => void>()
  const send = (m: object) => ws.send(JSON.stringify(m))
  const emit = (e: AgentEvent) => { opts.onEvent?.(e); listeners.forEach((l) => l(e)) }

  ws.onmessage = ({ data }: { data: string }) => {
    const m = JSON.parse(String(data)) as Raw
    if (m.type === 'ping') return send({ type: 'pong', event_id: m.ping_event.event_id })
    if (m.type === 'client_tool_call') {
      emit({ type: 'tool_call', name: m.client_tool_call.tool_name, params: m.client_tool_call.parameters ?? {} })
      return void runTool(opts.tools ?? {}, m.client_tool_call, send)
    }
    const event = toEvent(m)
    if (event) emit(event)
  }
  ws.onclose = () => emit({ type: 'close' })

  const api = {
    sendText: (text: string) => send({ type: 'user_message', text }),
    sendAudio: (base64: string) => send({ user_audio_chunk: base64 }),
    sendContext: (text: string) => send({ type: 'contextual_update', text }),
    close: () => ws.close(),
    waitFor<T extends AgentEvent['type']> (type: T, timeoutMs = 15000) {
      return new Promise<Extract<AgentEvent, { type: T }>>((resolve, reject) => {
        const timer = setTimeout(() => { listeners.delete(l); reject(new Error(`timeout waiting for ${type}`)) }, timeoutMs)
        const l = (e: AgentEvent) => { if (e.type === type) { clearTimeout(timer); listeners.delete(l); resolve(e as never) } }
        listeners.add(l)
      })
    }
  }
  return new Promise<typeof api>((resolve, reject) => {
    ws.onerror = (e: unknown) => reject(e)
    ws.onopen = () => {
      send({ type: 'conversation_initiation_client_data', dynamic_variables: opts.dynamicVariables ?? {} })
      resolve(api)
    }
  })
}

export type AgentSocket = Awaited<ReturnType<typeof connectAgent>>
