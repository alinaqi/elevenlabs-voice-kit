import { describe, expect, it, vi } from 'vitest'
import { createVoiceKit } from '../src/server/index.js'
import { getPreset } from '../src/presets/index.js'

const audio = () => new ReadableStream<Uint8Array>({
  start(c) { c.enqueue(new Uint8Array([1, 2])); c.enqueue(new Uint8Array([3])); c.close() }
})

function fakeClient(existing: Array<{ agentId: string, name: string }> = []) {
  return {
    textToSpeech: { convert: vi.fn(async () => audio()) },
    speechToText: { convert: vi.fn(async () => ({ text: 'مرحبا', languageCode: 'ara' })) },
    voices: { search: vi.fn(async () => ({ voices: [{ voiceId: 'v1', name: 'Sarah', labels: { accent: 'american' }, previewUrl: 'u' }] })) },
    conversationalAi: {
      agents: {
        list: vi.fn(async () => ({ agents: existing })),
        create: vi.fn(async () => ({ agentId: 'agent_new' })),
        update: vi.fn(async () => ({}))
      },
      conversations: {
        getWebrtcToken: vi.fn(async () => ({ token: 'tok' })),
        getSignedUrl: vi.fn(async () => ({ signedUrl: 'wss://x' }))
      }
    }
  }
}

describe('createVoiceKit', () => {
  it('requires an API key or client', () => {
    const prev = process.env.ELEVENLABS_API_KEY
    delete process.env.ELEVENLABS_API_KEY
    expect(() => createVoiceKit()).toThrow(/ELEVENLABS_API_KEY/)
    process.env.ELEVENLABS_API_KEY = prev
  })

  it('speak() returns audio bytes using a multilingual model for Arabic', async () => {
    const client = fakeClient()
    const kit = createVoiceKit({ client: client as never })
    const bytes = await kit.speak('مرحبا بكم', { language: 'ar' })
    expect(Array.from(bytes)).toEqual([1, 2, 3])
    const [voiceId, body] = client.textToSpeech.convert.mock.calls[0] as unknown as [string, { modelId: string, languageCode: string }]
    expect(voiceId).toBeTruthy()
    expect(body).toMatchObject({ modelId: 'eleven_flash_v2_5', languageCode: 'ar' })
  })

  it('speak() rejects empty or oversized text', async () => {
    const kit = createVoiceKit({ client: fakeClient() as never })
    await expect(kit.speak('')).rejects.toThrow()
    await expect(kit.speak('a'.repeat(5001))).rejects.toThrow()
  })

  it('transcribe() returns text and detected language', async () => {
    const kit = createVoiceKit({ client: fakeClient() as never })
    const result = await kit.transcribe(new Blob([new Uint8Array([1])]))
    expect(result).toEqual({ text: 'مرحبا', language: 'ara' })
  })

  it('listVoices() returns a compact shape', async () => {
    const kit = createVoiceKit({ client: fakeClient() as never })
    expect(await kit.listVoices()).toEqual([{ id: 'v1', name: 'Sarah', accent: 'american', previewUrl: 'u' }])
  })

  it('ensureAgent() creates when missing and updates when present', async () => {
    const fresh = fakeClient()
    const kit = createVoiceKit({ client: fresh as never })
    expect(await kit.ensureAgent(getPreset('hala')!)).toBe('agent_new')
    expect(fresh.conversationalAi.agents.create).toHaveBeenCalledOnce()

    const found = fakeClient([{ agentId: 'agent_old', name: 'voice-kit · HALA Concierge' }])
    const kit2 = createVoiceKit({ client: found as never })
    expect(await kit2.ensureAgent(getPreset('hala')!)).toBe('agent_old')
    expect(found.conversationalAi.agents.update).toHaveBeenCalledOnce()
    expect(found.conversationalAi.agents.create).not.toHaveBeenCalled()
  })

  it('mints conversation tokens and signed URLs', async () => {
    const kit = createVoiceKit({ client: fakeClient() as never })
    expect(await kit.conversationToken('a1')).toBe('tok')
    expect(await kit.signedUrl('a1')).toBe('wss://x')
  })
})
