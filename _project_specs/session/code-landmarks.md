# Code landmarks

- `packages/voice-kit/src/server/kit.ts`: `createVoiceKit` entry point
- `packages/voice-kit/src/presets/build.ts`: preset → ElevenAgents config (language/model rules)
- `packages/voice-kit/src/server/agents.ts`: `ensureAgent`, channel variants (web/phone/avatar)
- `packages/voice-kit/src/server/agent-socket.ts`: server-side agent conversation (phone, tests)
- `packages/voice-kit/src/tools/handlers.ts`: demo tool handlers. `hold.ts`: `withHold`
- `apps/phone/src/bridge.ts`: Twilio ⇄ agent bridge. `hold.ts`: μ-law hold streaming
- `services/research/research_service/research.py`: `research` (thorough) / `research_fast` (race)
