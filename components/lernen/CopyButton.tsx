'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button onClick={copy} className="p-2 rounded-lg cursor-pointer flex-shrink-0 transition-all"
      style={{ border: '1px solid var(--border)', color: copied ? '#10b981' : 'var(--muted)' }}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  )
}
