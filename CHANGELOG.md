# Changelog

## [Unreleased]

### Added
- `@workhub/voice-kit` library: one-key `createVoiceKit()` (TTS, STT, voices, music, agents, tokens, signed URLs), presets for the three Voice of the Oasis challenges, client tools, mock DSO calendar/catalogue/places, `withHold` hold-music orchestration, `connectAgent` server-side agent socket, Next.js route handlers, React `useVoiceAgent` hook, Speech Engine helper with Gemini responder, μ-law encoder.
- Demo app (Next.js) with agent consoles, talking avatar (LiveAvatar), research, TTS, STT and build guide; DSO × ElevenLabs × Doers Summit branding, powered by Palgu.
- Phone bridge (Twilio Media Streams ⇄ ElevenAgents) with ElevenLabs-voiced EN/AR menu and in-call hold music.
- Research service (FastAPI + pydantic-ai, Gemini 3.8 Flash + OpenAI) with 36 prefetched hackathon facts.
- ElevenLabs-generated hold music (MP3 + 8 kHz μ-law).
- Live E2E scripts: API smoke test, text conversations, Twilio simulation, headless-browser fake-mic test.

### Fixed
- Arabic speech garbled on English-primary agents: bilingual presets now use a multilingual base language (ADR 0004).
- Service matcher picked "new visa" for "renew visa" (substring match); now whole-word scoring.
- Research cache false positives on place names; stemmer kept `bus`/`buses` apart.
