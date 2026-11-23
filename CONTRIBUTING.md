# Contributing

1. **TDD:** write a failing test, make it pass, then refactor. `npm test` (library), `npm test -w @voice-kit/phone`, `cd services/research && uv run pytest`.
2. **Quality gates:** ≤ 200 lines per file, ≤ 20 lines per function, ≤ 3 parameters, coverage ≥ 80%. Generated data (`src/data/facts.ts`) is exempt.
3. **ADRs:** read `docs/adr/` before changing architecture. Add an ADR for any new pattern.
4. **Changelog:** every behaviour change adds a line to `CHANGELOG.md` in the same commit.
5. **Secrets:** never commit keys. Use `.env.local`; `.env.example` lists names only. CI runs gitleaks.
6. **Live checks:** run `scripts/smoke-live.mts` before a release.
