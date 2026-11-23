# 0001 - Library-first monorepo

**Status:** accepted
**Date:** 2026-11-24
**Spec:** _project_specs/overview.md
**Deciders:** Ali Shaheen, Claude

## Context
Twelve hackathon teams need to add ElevenLabs voice to very different apps in 24 hours. A demo alone doesn't help them; they need code they can drop in.

## Decision
An npm-workspaces monorepo. `packages/voice-kit` is the product: a TypeScript library with subpath exports `/presets`, `/tools`, `/next` and `/react`. `apps/demo`, `apps/phone` and `services/research` consume it the same way a team would.

## Consequences
Every demo doubles as a usage example. The library must stay framework-light: Next.js and React are optional peers.

## Alternatives Considered
| Option | Pros | Cons | Why Not |
|---|---|---|---|
| Template app only | Fast | Teams must copy-paste | Not reusable |
| Separate repos | Isolation | Version drift during a 24 h event | Too slow |
