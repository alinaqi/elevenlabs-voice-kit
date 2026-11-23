'use client'
import { useState } from 'react'
import { AGENT_PROMPT, SITE_URL } from '@/lib/site'

/** Slim strip under the header: one click copies setup instructions for a coding agent. */
export function AgentPromptBar () {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(AGENT_PROMPT).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div className='agentbar'>
      <div className='inner'>
        <span className='agentbar-label'>🤖 Using Claude Code, Codex or Cursor?</span>
        <code className='agentbar-text' title={AGENT_PROMPT}>Read {SITE_URL}/llms-full.txt and integrate @workhub/voice-kit into this app…</code>
        <button className='btn solid agentbar-btn' onClick={copy}>{copied ? '✓ copied — paste it into your agent' : 'copy instructions for your coding agent'}</button>
      </div>
    </div>
  )
}
