import { describe, expect, it, vi } from 'vitest'
import { geminiResponder, toGeminiContents } from '../src/server/llm.js'
import { serveSpeechEngine } from '../src/server/speech-engine.js'

const sse = (chunks: string[]) => new Response(
  chunks.map((t) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\n\n`).join(''),
  { status: 200 }
)

async function collect(it: AsyncIterable<string>) {
  const out: string[] = []
  for await (const c of it) out.push(c)
  return out
}

describe('toGeminiContents', () => {
  it('maps agent→model and user→user', () => {
    expect(toGeminiContents([{ role: 'user', content: 'hi' }, { role: 'agent', content: 'yo' }])).toEqual([
      { role: 'user', parts: [{ text: 'hi' }] },
      { role: 'model', parts: [{ text: 'yo' }] }
    ])
  })
})

describe('geminiResponder', () => {
  it('streams text chunks from Gemini SSE', async () => {
    const fetchFn = vi.fn(async () => sse(['Hello', ' there']))
    const respond = geminiResponder({ apiKey: 'k', systemPrompt: 'be brief', fetchFn })
    const chunks = await collect(respond([{ role: 'user', content: 'hi' }], new AbortController().signal))
    expect(chunks.join('')).toBe('Hello there')
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('streamGenerateContent?alt=sse')
    expect(JSON.parse(String(init.body)).systemInstruction.parts[0].text).toBe('be brief')
  })

  it('throws on upstream errors', async () => {
    const respond = geminiResponder({ apiKey: 'k', systemPrompt: 's', fetchFn: async () => new Response('no', { status: 500 }) })
    await expect(collect(respond([], new AbortController().signal))).rejects.toThrow(/500/)
  })
})

describe('serveSpeechEngine', () => {
  it('attaches and forwards transcripts to the responder', async () => {
    const attach = vi.fn((_id: string, _srv: unknown, _path: string, cb: { onTranscript: Function }) => {
      const session = { sendResponse: vi.fn(async () => {}) }
      cb.onTranscript([{ role: 'user', content: 'hi' }], new AbortController().signal, session)
      return { close: vi.fn(), session }
    })
    const respond = vi.fn(async function * () { yield 'ok' })
    const attachment = serveSpeechEngine({
      client: { speechEngine: { attach } } as never,
      engineId: 'seng_1',
      httpServer: {} as never,
      respond
    })
    expect(attach.mock.calls[0][2]).toBe('/ws')
    expect(respond).toHaveBeenCalledOnce()
    expect((attachment as unknown as { session: { sendResponse: Function } }).session.sendResponse).toHaveBeenCalled()
  })
})
