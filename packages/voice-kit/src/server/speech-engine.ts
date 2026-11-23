import type { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import type { Server } from 'node:http'
import type { Responder } from './llm.js'

export interface ServeSpeechEngineOptions {
  client: Pick<ElevenLabsClient, 'speechEngine'>
  engineId: string
  httpServer: Server
  respond: Responder
  path?: string
  debug?: boolean
}

/**
 * Speech Engine: ElevenLabs does STT + TTS + turn-taking, your `respond` function is the brain.
 * Interruptions abort `signal`, cancelling your in-flight LLM call.
 */
export function serveSpeechEngine ({ client, engineId, httpServer, respond, path = '/ws', debug = false }: ServeSpeechEngineOptions) {
  return client.speechEngine.attach(engineId, httpServer, path, {
    debug,
    onTranscript (transcript, signal, session) {
      void session.sendResponse(respond(transcript, signal)).catch((err: unknown) => {
        if (!signal.aborted) console.error('[voice-kit] speech engine response failed', err)
      })
    },
    onError (err) { console.error('[voice-kit] speech engine error', err) }
  })
}

/** Register a Speech Engine that ElevenLabs will connect to at `wsUrl` (must be public wss://). */
export async function createSpeechEngine (client: Pick<ElevenLabsClient, 'speechEngine'>, name: string, wsUrl: string) {
  const engine = await client.speechEngine.create({ name, speechEngine: { wsUrl } } as never)
  return engine.engineId
}
