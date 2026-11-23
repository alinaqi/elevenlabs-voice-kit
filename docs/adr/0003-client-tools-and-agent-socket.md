# 0003 - Client tools everywhere, executed by whoever holds the conversation

**Status:** accepted
**Date:** 2026-11-24
**Deciders:** Ali Shaheen, Claude

## Context
Bookings, routes and research must work on the web, on the phone and in tests. Server webhook tools would need a public URL per team.

## Decision
Every preset tool is an ElevenAgents *client* tool. Who executes it depends on who holds the conversation:
- On the web, the browser runs it (`useVoiceAgent`).
- On the phone, in tests and in bots, the server runs it, through `connectAgent` over the agent WebSocket.

Both use the same `createDemoToolHandlers`.

## Consequences
The avatar embed holds its own conversation and cannot run tools, so the avatar variant is knowledge-only.

## Alternatives Considered
| Option | Pros | Cons | Why Not |
|---|---|---|---|
| Webhook tools | Works in avatar | Needs a public URL and auth per team | Setup cost |
