# 0004 - Bilingual agents use the non-English language as the base

**Status:** accepted
**Date:** 2026-11-24
**Deciders:** Claude (found in live E2E)

## Context
ElevenLabs forces English-primary agents onto `eleven_flash_v2`, which is English-only. When the LLM answered in Arabic without first calling `language_detection`, callers heard garbled audio.

## Decision
A multilingual preset makes its first non-English language the base, which selects `eleven_flash_v2_5` (multilingual). English becomes a language preset. The greeting is a short bilingual line, and the agent LLM is `gemini-3.8-flash`, which reliably follows "reply in the caller's language".

## Consequences
Verified in a real PSTN call and a phone simulation: EN → EN, AR → AR, EN → EN within one conversation.
