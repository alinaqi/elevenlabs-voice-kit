import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'
import { CopyPrompt } from '@/components/CopyPrompt'
import { AGENT_PROMPT, SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'
const SITE = SITE_URL

const PROMPTS = [
  { label: 'Claude Code / Cursor', text: AGENT_PROMPT },
  { label: 'Codex', text: `Follow ${SITE}/llms-full.txt to integrate @workhub/voice-kit into this repo: install from the release tarball, add /api/token and /api/research, render useVoiceAgent({ preset: 'navigator' }) on a new page, and verify with curl.` },
  { label: 'Custom agent', text: `Using ${SITE}/llms-full.txt (recipe 2c), create a definePreset for <describe your use case> in English and Arabic with tools <list>, register it with tokenRoute({ presets }), and implement the tool handlers in useVoiceAgent.` }
]

export default function DocsPage () {
  const md = readFileSync(join(process.cwd(), 'public', 'llms-full.txt'), 'utf8')
  const html = marked.parse(md, { async: false })
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Docs <em>&amp; llms.txt</em></h1>
      <p className='dim' style={{ maxWidth: 760 }}>
        Point your coding agent at <a href='/llms.txt'>/llms.txt</a> (index) or <a href='/llms-full.txt'>/llms-full.txt</a> (full reference).
        It has install steps, every export, recipes for Next.js, Express and Vite, and the ElevenLabs gotchas we already hit.
      </p>
      <h2 className='prompt' style={{ marginTop: 24 }}>point your agent</h2>
      {PROMPTS.map((p) => <CopyPrompt key={p.label} {...p} />)}
      <h2 className='prompt' style={{ marginTop: 24 }}>reference</h2>
      <article className='docs card' dangerouslySetInnerHTML={{ __html: html }} />
    </>
  )
}
