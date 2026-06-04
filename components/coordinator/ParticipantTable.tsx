'use client'

import { useState } from 'react'
import { Key, X, Copy, Check } from 'lucide-react'
import type { ParticipantWithStats } from '@/types'

function formatDate(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function XpBar({ xp }: { xp: number }) {
  const pct = Math.min((xp / 1000) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
      </div>
      <span className="text-xs font-medium w-14 text-right" style={{ color: 'var(--text)' }}>{xp} XP</span>
    </div>
  )
}

interface Credentials {
  full_name: string
  participant_code: string
  password: string
}

export default function ParticipantTable({ participants }: { participants: ParticipantWithStats[] }) {
  const [modal, setModal] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function resetPassword(participantId: string) {
    setLoading(participantId)
    const res = await fetch('/api/coordinator/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participant_id: participantId }),
    })
    const data = await res.json()
    if (res.ok) setModal(data)
    setLoading(null)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid var(--border)` }}>
              {['Name', 'Code', 'Fortschritt', 'Lektionen', 'Jobs', 'Zuletzt aktiv', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < participants.length - 1 ? `1px solid var(--border)` : 'none' }}>
                <td className="px-6 py-4 font-medium">{p.full_name}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                    {p.participant_code}
                  </span>
                </td>
                <td className="px-6 py-4 min-w-36"><XpBar xp={p.total_xp} /></td>
                <td className="px-6 py-4 text-center">{p.lessons_completed}</td>
                <td className="px-6 py-4 text-center">{p.jobs_saved}</td>
                <td className="px-6 py-4" style={{ color: p.last_active ? 'var(--success)' : 'var(--muted)' }}>
                  {formatDate(p.last_active)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => resetPassword(p.id)}
                    disabled={loading === p.id}
                    title="Zugangsdaten / Passwort zurücksetzen"
                    className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[var(--bg)]"
                    style={{ color: 'var(--muted)' }}>
                    {loading === p.id
                      ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Key size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-xl p-6 shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Zugangsdaten</h3>
              <button onClick={() => setModal(null)} className="p-1 cursor-pointer" style={{ color: 'var(--muted)' }}>
                <X size={16} />
              </button>
            </div>

            <p className="font-medium mb-4">{modal.full_name}</p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Code</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{modal.participant_code}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--muted)' }}>Neues Passwort</span>
                <span className="font-mono font-bold">{modal.password}</span>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(`Code: ${modal.participant_code}\nPasswort: ${modal.password}`)}
              className="btn-primary w-full justify-center mt-5 text-sm"
              style={{ padding: '0.625rem 1rem' }}>
              {copied ? <><Check size={14} /> Kopiert</> : <><Copy size={14} /> Kopieren</>}
            </button>

            <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
              Das alte Passwort ist damit ungültig.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
