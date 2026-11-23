# 0005 - Own Twilio media-stream bridge (from gb_voice_claude) with in-call hold music

**Status:** accepted
**Date:** 2026-11-24
**Deciders:** Ali Shaheen

## Context
Hold music has to play inside the call while a slow tool runs. ElevenLabs' native Twilio integration gives no hook to inject audio.

## Decision
`apps/phone` follows the gb_voice_claude pattern:
1. Twilio `<Connect><Stream>` connects to our WebSocket.
2. The bridge talks to the agent's phone variant over the agent WebSocket, μ-law 8 kHz both ways.
3. Tools run server-side.
4. `phoneHold` streams μ-law frames and sends `clear` before the agent speaks again.

The menu is ElevenLabs TTS played with `<Play>`, so no Twilio voices are used.

## Consequences
The bridge needs a long-lived host (Render), not Vercel.
