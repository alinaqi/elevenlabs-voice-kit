# AGENTS.md

## Project Context
- Language: TypeScript (library, apps) + Python 3.12 (research service)
- Framework: Next.js 16 (App Router) · Node http + ws (phone) · FastAPI + pydantic-ai (research)
- Voice: ElevenLabs (`@elevenlabs/elevenlabs-js`, `@elevenlabs/react`), ElevenAgents, Music, Scribe
- Testing: Vitest (TS), pytest (Python), live E2E scripts in `scripts/` and `e2e/`

## Commands
npm test                         # library tests
npm test -w @voice-kit/phone     # phone tests
cd services/research && uv run pytest

## Conventions
See CLAUDE.md (rules, layout) and CONTRIBUTING.md. Decisions in docs/adr/.
