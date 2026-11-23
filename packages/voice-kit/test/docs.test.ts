import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const ENTRIES: Record<string, string> = {
  '@workhub/voice-kit': '../src/index.js',
  '@workhub/voice-kit/next': '../src/next/index.js',
  '@workhub/voice-kit/tools': '../src/tools/index.js',
  '@workhub/voice-kit/presets': '../src/presets/index.js'
}

const docs = ['../../../llms-full.txt', '../../../README.md'].map((p) => readFileSync(new URL(p, import.meta.url), 'utf8')).join('\n')
const imports = [...docs.matchAll(/import \{([^}]+)\} from '(@workhub\/voice-kit[^']*)'/g)]
  .map(([, names, from]) => ({ from, names: names.split(',').map((n) => n.trim().replace(/^type /, '')).filter(Boolean) }))

describe('docs stay in sync with the code', () => {
  it('finds imports to check', () => { expect(imports.length).toBeGreaterThan(5) })

  it.each(imports.filter((i) => ENTRIES[i.from]))('$from exports $names', async ({ from, names }) => {
    const mod = await import(ENTRIES[from]) as Record<string, unknown>
    for (const n of names) expect(mod, `${n} missing from ${from}`).toHaveProperty(n)
  })
})
