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

describe('guides point at the live site', () => {
  const read = (p: string) => readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8')
  const SITE = 'https://voice-of-the-oasis.palgu.ai'

  it.each(['README.md', 'llms.txt', 'llms-full.txt', 'CLAUDE.md', '_project_specs/session/current-state.md'])('%s uses the canonical domain', (file) => {
    const text = read(file)
    expect(text).toContain(SITE)
    expect(text).not.toContain('voice-kit-demo.vercel.app')
  })

  it('llms.txt links the full reference, the docs page and the current release', () => {
    const text = read('llms.txt')
    const version = JSON.parse(read('packages/voice-kit/package.json')).version as string
    expect(text).toContain(`${SITE}/llms-full.txt`)
    expect(text).toContain(`${SITE}/docs`)
    expect(text).toContain(`v${version}/workhub-voice-kit-${version}.tgz`)
  })
})
