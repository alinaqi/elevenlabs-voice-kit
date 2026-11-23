import { describe, expect, it, vi } from 'vitest'
import { connectAgent } from '../src/server/agent-socket.js'

class FakeSocket {
  static last: FakeSocket
  sent: unknown[] = []
  onopen?: () => void
  onmessage?: (e: { data: string }) => void
  onclose?: () => void
  onerror?: (e: unknown) => void
  constructor (public url: string) { FakeSocket.last = this; setTimeout(() => this.onopen?.(), 0) }
  send (data: string) { this.sent.push(JSON.parse(data)) }
  close () { this.onclose?.() }
  emit (msg: unknown) { this.onmessage?.({ data: JSON.stringify(msg) }) }
}

const flush = () => new Promise((r) => setTimeout(r, 5))
const open = async (opts = {}) => {
  const events: Array<{ type: string }> = []
  const socket = await connectAgent({ signedUrl: 'wss://x', WebSocketImpl: FakeSocket as never, onEvent: (e) => events.push(e), ...opts })
  return { socket, events, ws: FakeSocket.last }
}

describe('connectAgent', () => {
  it('sends initiation data with dynamic variables on open', async () => {
    const { ws } = await open({ dynamicVariables: { caller: 'Sara' } })
    expect(ws.sent[0]).toMatchObject({ type: 'conversation_initiation_client_data', dynamic_variables: { caller: 'Sara' } })
  })

  it('maps server events and answers pings', async () => {
    const { ws, events } = await open()
    ws.emit({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'c1' } })
    ws.emit({ type: 'agent_response', agent_response_event: { agent_response: 'Hello' } })
    ws.emit({ type: 'user_transcript', user_transcription_event: { user_transcript: 'Hi' } })
    ws.emit({ type: 'audio', audio_event: { audio_base_64: 'AAA=', event_id: 3 } })
    ws.emit({ type: 'interruption', interruption_event: { event_id: 3 } })
    ws.emit({ type: 'ping', ping_event: { event_id: 7 } })
    expect(events.map((e) => e.type)).toEqual(['metadata', 'agent', 'user', 'audio', 'interruption'])
    expect(ws.sent).toContainEqual({ type: 'pong', event_id: 7 })
  })

  it('runs client tools and returns results (errors flagged)', async () => {
    const tools = { ok: vi.fn(async () => 'done'), bad: vi.fn(async () => { throw new Error('nope') }) }
    const { ws } = await open({ tools })
    ws.emit({ type: 'client_tool_call', client_tool_call: { tool_name: 'ok', tool_call_id: 't1', parameters: { a: 1 } } })
    ws.emit({ type: 'client_tool_call', client_tool_call: { tool_name: 'bad', tool_call_id: 't2', parameters: {} } })
    ws.emit({ type: 'client_tool_call', client_tool_call: { tool_name: 'missing', tool_call_id: 't3', parameters: {} } })
    await flush()
    expect(tools.ok).toHaveBeenCalledWith({ a: 1 })
    expect(ws.sent).toContainEqual({ type: 'client_tool_result', tool_call_id: 't1', result: 'done', is_error: false })
    expect(ws.sent).toContainEqual(expect.objectContaining({ tool_call_id: 't2', is_error: true }))
    expect(ws.sent).toContainEqual(expect.objectContaining({ tool_call_id: 't3', is_error: true }))
  })

  it('sends text, audio and contextual updates', async () => {
    const { socket, ws } = await open()
    socket.sendText('hello')
    socket.sendAudio('BASE64')
    socket.sendContext('caller is on page 2')
    expect(ws.sent.slice(1)).toEqual([
      { type: 'user_message', text: 'hello' },
      { user_audio_chunk: 'BASE64' },
      { type: 'contextual_update', text: 'caller is on page 2' }
    ])
  })

  it('waitFor resolves on the next matching event', async () => {
    const { socket, ws } = await open()
    const next = socket.waitFor('agent', 1000)
    ws.emit({ type: 'agent_response', agent_response_event: { agent_response: 'Yes' } })
    expect(await next).toMatchObject({ type: 'agent', text: 'Yes' })
    await expect(socket.waitFor('agent', 10)).rejects.toThrow(/timeout/)
  })
})
