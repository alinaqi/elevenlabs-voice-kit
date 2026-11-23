# 0006 - pydantic-ai research service with prefetch and fast race

**Status:** accepted
**Date:** 2026-11-24
**Deciders:** Ali Shaheen

## Context
Agents must answer accurately about DSO topics. Sources contradict each other (minimum capital, for example), and callers on hold need fast answers.

## Decision
A Python FastAPI service using pydantic-ai, with Gemini (`gemini-3.8-flash`) and OpenAI (`gpt-5-mini`), both with web search. The judge guide's facts are trusted context.
- **Prefetch:** 36 topics, researched by both models and reconciled. The results ship in the library and are served instantly.
- **Live lookups** race both models and return the first answer with confidence above low.

## Consequences
A prefetched fact answers in about 2 ms. A live lookup takes about 6–10 s and is covered by hold music.
