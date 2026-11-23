# Voice Kit — ElevenLabs starter kit for Voice of the Oasis

> **A Palgu-sponsored starter kit** for the *Voice of the Oasis* hackathon
> (Dubai Silicon Oasis × ElevenLabs × Doers Summit, Dtec, 24–25 Nov 2026).

Ship a bilingual (English / عربي) ElevenLabs voice agent in minutes, with **one key**: `ELEVENLABS_API_KEY`.

- **Live demo:** https://voice-kit-demo.vercel.app
- **Call the agents:** `+1 350 218 1012`. Press 1 for Navigator, 2 for Soft Landing, 3 for HALA.
- **Research API:** https://voice-kit-research.vercel.app

```
npm i https://github.com/alinaqi/elevenlabs-voice-kit/releases/download/v0.1.0/workhub-voice-kit-0.1.0.tgz @elevenlabs/react
echo "ELEVENLABS_API_KEY=sk_..." >> .env.local
```

The package installs from the GitHub release tarball; an npm registry publish is pending. Imports use `@workhub/voice-kit`.

## What's inside

| Piece | Path | What it does | Keys |
|---|---|---|---|
| **Library** | `packages/voice-kit` | TTS, STT, music, voice agents from presets, client tools, React hook, Next.js routes, phone/agent socket, Speech Engine helper | ElevenLabs only |
| **Demo app** | `apps/demo` | Next.js playground for the 3 challenges, avatar, research, TTS, STT, code samples | ElevenLabs (+ LiveAvatar optional) |
| **Phone bridge** | `apps/phone` | Twilio ⇄ ElevenAgents over WebSocket, ElevenLabs-voiced EN/AR menu, hold music during slow tools | + Twilio (add-on) |
| **Research service** | `services/research` | pydantic-ai (Gemini 3.8 Flash racing OpenAI, with web search), prefetched hackathon facts | hosted for you |

**The single-key promise:** agents, TTS, STT and hold music all run on your ElevenLabs key. The agents' LLM is hosted inside ElevenLabs. Research works out of the box: facts for every hackathon topic ship with the library, and other questions go to the hosted research API. The phone line (Twilio) and the talking avatar (LiveAvatar) are optional add-ons that need their own credentials.

## The three challenges, ready to talk

| Preset | Challenge | Tools wired in |
|---|---|---|
| `navigator` | 01 AI Voice Navigator (robot A) | `send_route_to_phone`, `research_fact`, `handover_to_human` |
| `soft-landing` | 02 Soft Landing Guide (web/phone) | `build_setup_checklist`, `book_appointment` (+ reschedule/cancel), `research_fact`, `handover_to_human` |
| `hala` | 03 HALA Concierge (robot B) | `find_service` (11 demo DSO services), `book_appointment`/`reschedule`/`cancel`, `research_fact`, `handover_to_human` |
| `assistant` | Blank bilingual assistant to fork | `research_fact`, `handover_to_human` |

Every preset:
- is bilingual and switches language mid-conversation;
- gives short answers first;
- carries the public facts from the judge guide, marked DEMO where the guide says so;
- caps a conversation at 5 minutes.

## Use it in your app (Next.js)

```ts
// app/api/token/route.ts: the agent is auto-created from the preset on first call
import { createVoiceKit } from '@workhub/voice-kit'
import { tokenRoute } from '@workhub/voice-kit/next'
export const GET = tokenRoute({ kit: createVoiceKit() })

// app/api/research/route.ts: needed by the research_fact tool
import { createResearchClient } from '@workhub/voice-kit'
import { researchRoute } from '@workhub/voice-kit/next'
export const POST = researchRoute({ research: createResearchClient() })
```

```tsx
'use client'
import { VoiceKitProvider, useVoiceAgent } from '@workhub/voice-kit/react'

function Talk () {
  const agent = useVoiceAgent({ preset: 'hala' })   // tools, transcript, hold music: all wired
  return <>
    <button onClick={agent.start}>{agent.status}</button>
    {agent.lines.map((l, i) => <p key={i}>{l.role}: {l.text}</p>)}
    {agent.onHold && <p>♪ researching…</p>}
  </>
}
export default () => <VoiceKitProvider><Talk /></VoiceKitProvider>
```

Put `hold-music.mp3` from `assets/` in your `public/` folder.

### Your own agent

```ts
import { definePreset, defineClientTool } from '@workhub/voice-kit'

export const myAgent = definePreset({
  id: 'my-agent', name: 'My Agent', description: '…', languages: ['en', 'ar'],
  greeting: 'Hi! مرحباً! How can I help?',
  firstMessage: { en: 'Hi!', ar: 'مرحباً!' },
  systemPrompt: 'You are …',
  knowledge: ['fact 1', 'fact 2'],
  tools: [defineClientTool({ name: 'check_status', description: 'Check an application', params: { ref: { type: 'string', description: 'Reference' } } })]
})
// server: kit.ensureAgent(myAgent) → agentId (idempotent, updates in place)
// client: useVoiceAgent({ preset: 'my-agent', tools: { check_status: async ({ ref }) => '…' } })
```

### Server-only building blocks

```ts
const kit = createVoiceKit()                                  // reads ELEVENLABS_API_KEY
await kit.speak('مرحبا بكم', { language: 'ar' })               // → mp3 bytes (multilingual model picked for you)
await kit.transcribe(blob)                                    // → { text, language }
await kit.composeMusic('calm hold music, oud and pads')       // → mp3 bytes
const socket = await connectAgent({ signedUrl: await kit.signedUrl(id), tools })  // server-side conversation
socket.sendText('Hello'); await socket.waitFor('agent')
```

**Speech Engine (bring your own LLM).** `serveSpeechEngine({ client, engineId, httpServer, respond: geminiResponder({ systemPrompt }) })`. It needs a public `wss://` server, so run it on Render or Fly, not Vercel.

## Hold music, done properly

When a tool such as `research_fact` takes longer than 1.2 s:

1. The agent says a short line first ("one moment, let me check…"). This uses `forcePreToolSpeech`.
2. Hold music starts.
3. Music stops the moment the answer is back.

| | How the music plays | How it stops |
|---|---|---|
| **Web** | Looping `<audio>`, fading in and out | Fades out |
| **Phone** | 20 ms μ-law frames streamed into the Twilio call | A `clear` flushes the buffer before the agent speaks |

Fast lookups never play music. The music always stops, even on errors. The track itself was generated with ElevenLabs Music (`scripts/make-hold-music.mts`).

## Run it locally

```bash
npm install
cp .env.example .env.local           # fill ELEVENLABS_API_KEY (the rest is optional)
npm test                              # library unit tests
npm run dev -w apps/demo              # http://localhost:3005
npm run dev -w apps/phone             # phone bridge on :3010 (needs Twilio + a public URL, e.g. cloudflared)
cd services/research && uv run pytest && uv run uvicorn app:app --port 8099
```

### End-to-end checks against the real APIs

```bash
cd scripts
npx tsx --env-file=../.env.local smoke-live.mts                  # TTS EN/AR, STT round-trip, voices, agents, token
npx tsx --env-file=../.env.local chat-e2e.mts hala               # text conversation with real tool calls
npx tsx --env-file=../.env.local phone-sim.mts hala "مرحبا…"     # acts as Twilio: μ-law audio in/out, transcribed
cd .. && npx tsx --env-file=.env.local e2e/browser.mts hala      # headless Chrome with a fake mic talking to the agent
```

## Deploy

- **Demo:** Vercel (`apps/demo`). Set `ELEVENLABS_API_KEY`. Optional: `AGENT_ID_*`, `LIVEAVATAR_*`.
- **Research:** Vercel Python (`services/research`). Set `GEMINI_API_KEY` and `OPENAI_API_KEY`.
- **Phone:** Render (`render.yaml`). Set `ELEVENLABS_API_KEY`, `TWILIO_*` and `PUBLIC_BASE_URL`. Then point your Twilio number's voice webhook at `https://<host>/twiml`.

## Notes for hackathon teams

- All fees and processing times are **demo values**. The guide says so too: the real ones sit behind DSO's member login.
- Indoor details (entrances, lifts) are demo data; agents hedge with "I believe".
- Robots: build the voice layer only. MangoBot controls movement.
- Judging weights *working demo* at 25%, and *ElevenLabs depth* and *voice UX* at 20% each. This kit covers the plumbing so you can spend your 24 hours on those.

---

Built for Voice of the Oasis · Dubai Silicon Oasis × ElevenLabs × Doers Summit · **Powered by Palgu**. MIT licensed.
