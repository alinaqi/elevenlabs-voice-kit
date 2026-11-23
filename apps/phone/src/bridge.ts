import type { AgentEvent, AgentSocket, AgentSocketOptions, HoldController, ToolHandlers } from '@workhub/voice-kit'
import type { WebSocket } from 'ws'
import { phoneHold } from './hold.js'

export interface BridgeDeps {
  signedUrlFor: (preset: string) => Promise<string>
  connect: (opts: AgentSocketOptions) => Promise<AgentSocket>
  toolsFor: (hold: HoldController, preset: string) => ToolHandlers
  holdAudio: Uint8Array
}

interface TwilioMsg { event: string, start?: { streamSid: string, customParameters?: Record<string, string> }, media?: { payload: string } }

/** One phone call: Twilio media stream ⇄ ElevenAgents conversation, with hold music during slow tools. */
export function bridgeCall (twilio: WebSocket, deps: BridgeDeps): void {
  let streamSid = ''
  let agent: AgentSocket | undefined
  const early: string[] = []
  const toTwilio = (m: object) => twilio.send(JSON.stringify(m))
  const clear = () => toTwilio({ event: 'clear', streamSid })
  const hold = phoneHold({ audio: deps.holdAudio, sendFrame: (payload) => toTwilio({ event: 'media', streamSid, media: { payload } }), clear })

  const onAgentEvent = (e: AgentEvent) => {
    if (e.type === 'audio') { if (hold.playing()) hold.stop(); toTwilio({ event: 'media', streamSid, media: { payload: e.base64 } }) }
    if (e.type === 'interruption') clear()
    if (e.type === 'close') { hold.stop(); twilio.close() }
  }

  async function start (msg: TwilioMsg) {
    streamSid = msg.start?.streamSid ?? ''
    const preset = msg.start?.customParameters?.preset ?? 'hala'
    agent = await deps.connect({ signedUrl: await deps.signedUrlFor(preset), tools: deps.toolsFor(hold, preset), onEvent: onAgentEvent })
    early.splice(0).forEach((p) => agent?.sendAudio(p))
  }

  twilio.on('message', (raw: Buffer) => {
    const msg = JSON.parse(raw.toString()) as TwilioMsg
    if (msg.event === 'start') void start(msg).catch((err) => { console.error('[phone] agent connect failed', err); twilio.close() })
    if (msg.event === 'media' && msg.media) agent ? agent.sendAudio(msg.media.payload) : early.push(msg.media.payload)
    if (msg.event === 'stop') agent?.close()
  })
  twilio.on('close', () => { hold.stop(); agent?.close() })
}
