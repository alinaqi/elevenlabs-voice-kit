'use client'
import { useState } from 'react'

export function CopyPrompt ({ label, text }: { label: string, text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }
  return (
    <div className='card' style={{ marginBottom: 12 }}>
      <div className='row' style={{ justifyContent: 'space-between' }}>
        <span className='tag live'>{label}</span>
        <button className='btn' onClick={copy}>{copied ? '✓ copied' : 'copy'}</button>
      </div>
      <pre style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{text}</pre>
    </div>
  )
}
