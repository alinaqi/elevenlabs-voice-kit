const SNIPPETS: Array<[string, string]> = [
  ['1 · install + one key', `npm i https://github.com/alinaqi/elevenlabs-voice-kit/releases/download/v0.1.1/workhub-voice-kit-0.1.1.tgz @elevenlabs/react
echo "ELEVENLABS_API_KEY=sk_..." >> .env.local`],
  ['2 · drop-in Next.js routes', `// app/api/token/route.ts
import { createVoiceKit } from '@workhub/voice-kit'
import { tokenRoute } from '@workhub/voice-kit/next'
export const GET = tokenRoute({ kit: createVoiceKit() })   // agents auto-provisioned from presets

// app/api/research/route.ts
import { createResearchClient } from '@workhub/voice-kit'
import { researchRoute } from '@workhub/voice-kit/next'
export const POST = researchRoute({ research: createResearchClient() })`],
  ['3 · talk from React', `'use client'
import { VoiceKitProvider, useVoiceAgent } from '@workhub/voice-kit/react'

function Talk () {
  const agent = useVoiceAgent({ preset: 'hala' })   // tools, transcript, hold music wired
  return <button onClick={agent.start}>{agent.status}</button>
}
export default () => <VoiceKitProvider><Talk /></VoiceKitProvider>`],
  ['4 · your own agent', `import { definePreset, defineClientTool } from '@workhub/voice-kit'

export const myAgent = definePreset({
  id: 'my-agent', name: 'My Agent', description: '…', languages: ['en', 'ar'],
  firstMessage: { en: 'Hi!', ar: 'مرحباً!' },
  systemPrompt: 'You are …', knowledge: ['fact 1', 'fact 2'],
  tools: [defineClientTool({ name: 'check_status', description: '…', params: { ref: { type: 'string', description: 'Ref' } } })]
})
// useVoiceAgent({ preset: 'my-agent', tools: { check_status: async ({ ref }) => '…' } })`],
  ['5 · server only (TTS / STT / music)', `const kit = createVoiceKit()
const mp3 = await kit.speak('مرحبا', { language: 'ar' })
const { text } = await kit.transcribe(blob)
const music = await kit.composeMusic('calm hold music, oud and pads', { lengthMs: 30000 })`],
  ['6 · Speech Engine (bring your own LLM)', `import { createServer } from 'node:http'
import { serveSpeechEngine, geminiResponder, createVoiceKit } from '@workhub/voice-kit'

const http = createServer()
serveSpeechEngine({ client: createVoiceKit().client, engineId: 'seng_…', httpServer: http,
  respond: geminiResponder({ systemPrompt: 'Be brief.' }) })   // or any (transcript, signal) => AsyncIterable<string>
http.listen(3001)   // needs a public wss:// URL — run on Render/Fly, not Vercel`]
]

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Use it in <em>your app</em></h1>
      <p className='dim'>TypeScript library: <code>@workhub/voice-kit</code>. One ElevenLabs key powers agents, TTS, STT, music and research. Phone (Twilio) and avatar (LiveAvatar) are optional add-ons.</p>
      {SNIPPETS.map(([title, code]) => (
        <section key={title} style={{ marginTop: 20 }}><h3 className='prompt' style={{ fontSize: 15 }}>{title}</h3><pre>{code}</pre></section>
      ))}
    </>
  )
}
