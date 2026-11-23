# CLAUDE.md: Voice Kit (Palgu-sponsored ElevenLabs starter kit)

## Project
ElevenLabs starter kit for the Voice of the Oasis hackathon (DSO × ElevenLabs × Doers Summit). See README.md and `_project_specs/overview.md`.

## Live
- Demo + docs: https://voice-of-the-oasis.palgu.ai (Vercel project `voice-kit-demo`, team workhub; the default *.vercel.app URL serves the same deploy)
- Coding-agent docs: https://voice-of-the-oasis.palgu.ai/llms.txt · /llms-full.txt (canonical files at repo root; keep them in sync with the code, `test/docs.test.ts` enforces it)
- Research API: https://voice-kit-research.vercel.app · Phone: https://voice-kit-phone.onrender.com, Twilio +1 350 218 1012

## Layout
- `packages/voice-kit`: the TypeScript library (the product). Subpaths: `/presets`, `/tools`, `/next`, `/react`.
- `apps/demo`: Next.js demo on Vercel.
- `apps/phone`: Twilio ⇄ ElevenAgents bridge on Render.
- `services/research`: FastAPI + pydantic-ai on Vercel Python.
- `scripts/`, `e2e/`: live E2E checks. `docs/adr/`: decisions. `_project_specs/`: todos and session state.

## Commands
```bash
npm test                                   # library (vitest + coverage)
npm test -w @voice-kit/phone               # phone bridge
npm run build -w @workhub/voice-kit        # build lib (apps consume dist)
npm run build -w apps/demo                 # Next build
cd services/research && uv run pytest && uv run ruff check .
cd scripts && npx tsx --env-file=../.env.local smoke-live.mts
```

## Rules
- TDD (RED → GREEN → refactor). Quality gates: ≤ 200 lines per file, ≤ 20 lines per function, ≤ 3 params.
- Read `docs/adr/` before architectural changes. Update `CHANGELOG.md` in the same commit.
- The core must work with only `ELEVENLABS_API_KEY` (ADR 0002). Twilio and LiveAvatar are add-ons.
- Never commit secrets. Keys live in `.env.local` (gitignored) and in the hosting providers' env.
- English-primary agents must use `eleven_flash_v2` (API rule). Bilingual presets use a non-English base (ADR 0004).
