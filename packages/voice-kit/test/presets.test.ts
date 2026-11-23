import { describe, expect, it } from 'vitest'
import { buildAgentConfig, definePreset, getPreset, presets } from '../src/presets/index.js'
import { pickTtsModel } from '../src/languages.js'

describe('pickTtsModel', () => {
  it('uses the English-only flash model for English, multilingual otherwise', () => {
    expect(pickTtsModel(['en'])).toBe('eleven_flash_v2')
    expect(pickTtsModel(['en', 'ar'])).toBe('eleven_flash_v2_5')
  })
})

describe('definePreset', () => {
  it('requires a first message for every language', () => {
    expect(() =>
      definePreset({ id: 'x', name: 'X', description: 'd', languages: ['en', 'ar'], firstMessage: { en: 'Hi' }, systemPrompt: 'p' })
    ).toThrow(/ar/)
  })
})

describe('built-in presets', () => {
  it('ships the three hackathon challenges plus a generic assistant', () => {
    expect(Object.keys(presets).sort()).toEqual(['assistant', 'hala', 'navigator', 'soft-landing'])
    expect(getPreset('nope')).toBeUndefined()
  })

  it.each(['navigator', 'soft-landing', 'hala'])('%s is bilingual EN/AR with tools', (id) => {
    const preset = getPreset(id)!
    expect(preset.languages).toEqual(['en', 'ar'])
    expect(preset.tools.length).toBeGreaterThan(0)
    expect(preset.tools.map((t) => t.name)).toContain('handover_to_human')
  })
})

describe('buildAgentConfig', () => {
  const config = buildAgentConfig(getPreset('hala')!)

  it('names and tags the agent so it can be found again', () => {
    expect(config.name).toBe('voice-kit · HALA Concierge')
    expect(config.tags).toContain('voice-kit:hala')
  })

  it('makes bilingual agents multilingual-primary so Arabic is never spoken by the English-only model', () => {
    const cc = config.conversationConfig
    expect(cc.agent?.language).toBe('ar')
    expect(cc.tts?.modelId).toBe('eleven_flash_v2_5')
    expect(cc.languagePresets?.en?.overrides.agent?.language).toBe('en')
    expect(cc.agent?.firstMessage).toMatch(/Welcome to HALA/)
    expect(cc.agent?.firstMessage?.length).toBeLessThan(90)
    expect(cc.agent?.firstMessage).toMatch(/[\u0600-\u06FF]/)
    expect(cc.agent?.prompt?.builtInTools?.languageDetection).toBeDefined()
    expect(cc.agent?.prompt?.builtInTools?.endCall).toBeDefined()
  })

  it('keeps English-only agents on the fast English model', () => {
    const en = buildAgentConfig(definePreset({ id: 'e', name: 'E', description: 'd', languages: ['en'], firstMessage: { en: 'Hi' }, systemPrompt: 'p' }))
    expect(en.conversationConfig.agent?.language).toBe('en')
    expect(en.conversationConfig.tts?.modelId).toBe('eleven_flash_v2')
    expect(en.conversationConfig.agent?.firstMessage).toBe('Hi')
  })

  it('embeds knowledge into the prompt and caps conversation length', () => {
    expect(config.conversationConfig.agent?.prompt?.prompt).toContain('600 59 55 57')
    expect(config.conversationConfig.conversation?.maxDurationSeconds).toBe(300)
    expect(config.conversationConfig.agent?.prompt?.prompt).toMatch(/language_detection/)
    expect(config.conversationConfig.agent?.prompt?.llm).not.toMatch(/^gpt/)
  })

  it('declares every preset tool as a client tool', () => {
    const tools = config.conversationConfig.agent?.prompt?.tools ?? []
    expect(tools.every((t) => t.type === 'client')).toBe(true)
    expect(tools.map((t) => (t as { name: string }).name)).toContain('book_appointment')
    const research = tools.find((t) => (t as { name: string }).name === 'research_fact') as { responseTimeoutSecs: number, forcePreToolSpeech: boolean }
    expect(research.responseTimeoutSecs).toBe(30)
    expect(research.forcePreToolSpeech).toBe(true)
  })
})

describe('forChannel', async () => {
  const { forChannel } = await import('../src/server/agents.js')
  const body = buildAgentConfig(getPreset('hala')!)

  it('phone variant uses 8 kHz μ-law both ways', () => {
    const phone = forChannel(body, 'phone')
    expect(phone.name).toBe('voice-kit · HALA Concierge (phone)')
    expect((phone.conversationConfig.tts as { agentOutputAudioFormat?: string }).agentOutputAudioFormat).toBe('ulaw_8000')
  })

  it('avatar variant drops browser tools but keeps system tools', () => {
    const avatar = forChannel(body, 'avatar')
    expect(avatar.name).toBe('voice-kit · HALA Concierge (avatar)')
    expect(avatar.conversationConfig.agent?.prompt?.tools).toEqual([])
    expect(avatar.conversationConfig.agent?.prompt?.builtInTools?.languageDetection).toBeDefined()
    expect(avatar.conversationConfig.agent?.prompt?.prompt).toMatch(/cannot book/i)
    // LiveAvatar rejects anything but 24 kHz PCM (API error 4000)
    expect((avatar.conversationConfig.tts as { agentOutputAudioFormat?: string }).agentOutputAudioFormat).toBe('pcm_24000')
    expect((avatar.conversationConfig as { asr?: { userInputAudioFormat?: string } }).asr?.userInputAudioFormat).toBe('pcm_24000')
  })
})
