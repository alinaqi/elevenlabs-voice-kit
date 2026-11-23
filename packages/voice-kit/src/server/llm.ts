import type { TranscriptMessage } from '@elevenlabs/elevenlabs-js/wrapper/speech-engine/types.js'

export type Responder = (transcript: TranscriptMessage[], signal: AbortSignal) => AsyncIterable<string>

export function toGeminiContents (transcript: TranscriptMessage[]) {
  return transcript.map((m) => ({ role: m.role === 'agent' ? 'model' : 'user', parts: [{ text: m.content }] }))
}

async function * sseTexts (body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const e of events) yield * textsOf(e)
  }
  yield * textsOf(buffer)
}

function * textsOf (event: string): Iterable<string> {
  const line = event.split('\n').find((l) => l.startsWith('data: '))
  if (!line) return
  const json = JSON.parse(line.slice(6)) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  for (const p of json.candidates?.[0]?.content?.parts ?? []) if (p.text) yield p.text
}

export interface GeminiOptions { apiKey?: string, model?: string, systemPrompt: string, fetchFn?: typeof fetch }

/** Bring-your-own-LLM responder for Speech Engine, streaming from Gemini over plain fetch. */
export function geminiResponder ({ apiKey = process.env.GEMINI_API_KEY, model = 'gemini-2.5-flash', systemPrompt, fetchFn = fetch }: GeminiOptions): Responder {
  return async function * respond (transcript, signal) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
    const res = await fetchFn(url, {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey ?? '' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: toGeminiContents(transcript) })
    })
    if (!res.ok || !res.body) throw new Error(`gemini ${res.status}`)
    yield * sseTexts(res.body)
  }
}
