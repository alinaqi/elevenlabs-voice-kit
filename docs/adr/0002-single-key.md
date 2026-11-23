# 0002 - One ElevenLabs key powers the core

**Status:** accepted
**Date:** 2026-11-24
**Deciders:** Ali Shaheen

## Context
Collecting LLM, telephony and avatar keys costs teams hours.

## Decision
The core (agents, TTS, STT, music, research) needs only `ELEVENLABS_API_KEY`.
- Agents use an LLM hosted inside ElevenLabs (`gemini-3.8-flash`).
- Research falls back to facts bundled with the library, then to the hosted research API, which holds our provider keys.
- Phone (Twilio) and avatar (LiveAvatar) are explicit opt-in add-ons.

## Consequences
The hosted research API is a shared, rate-limited dependency. Teams can self-host it with `VOICE_KIT_RESEARCH_URL`.
