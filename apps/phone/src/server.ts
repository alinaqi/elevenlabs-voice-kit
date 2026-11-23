import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { validTwilioSignature } from './signature.js'
import { connectTwiml, menuTwiml, presetForDigit } from './twiml.js'

export interface PhoneServerDeps {
  publicUrl: () => string
  /** When set, every Twilio webhook must carry a valid X-Twilio-Signature. */
  authToken?: string
  menuAudio: () => Promise<Uint8Array>
  onMediaSocket: (ws: WebSocket) => void
}

async function readForm (req: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()))
}

const send = (res: ServerResponse, status: number, type: string, body: string | Uint8Array) =>
  res.writeHead(status, { 'content-type': type }).end(body)

async function twilioWebhook (req: IncomingMessage, res: ServerResponse, deps: PhoneServerDeps, path: string) {
  const form = await readForm(req)
  const signature = req.headers['x-twilio-signature'] as string | undefined
  if (deps.authToken && !validTwilioSignature(deps.authToken, deps.publicUrl() + path, form, signature)) {
    return send(res, 403, 'text/plain', 'invalid signature')
  }
  const xml = path === '/twiml' ? menuTwiml(deps.publicUrl()) : connectTwiml(deps.publicUrl(), presetForDigit(form.Digits))
  send(res, 200, 'text/xml', xml)
}

async function route (req: IncomingMessage, res: ServerResponse, deps: PhoneServerDeps) {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  if (path === '/health') return send(res, 200, 'application/json', '{"ok":true}')
  if (path === '/audio/menu.mp3') return send(res, 200, 'audio/mpeg', await deps.menuAudio())
  if (req.method === 'POST' && (path === '/twiml' || path === '/twiml/route')) return twilioWebhook(req, res, deps, path)
  send(res, 404, 'text/plain', 'not found')
}

/** HTTP for Twilio webhooks + the WebSocket endpoint Twilio streams call audio to. */
export function createPhoneServer (deps: PhoneServerDeps) {
  const server = createServer((req, res) => {
    route(req, res, deps).catch((err) => { console.error('[phone]', err); send(res, 500, 'text/plain', 'error') })
  })
  const wss = new WebSocketServer({ server, path: '/media' })
  wss.on('connection', deps.onMediaSocket)
  return server
}
