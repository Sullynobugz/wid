'use client'

import { useState } from 'react'
import { Key, X, Copy, Check, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Clock, BookOpen, Briefcase } from 'lucide-react'
import type { ApplicationRecord, ParticipantWithStats } from '@/types'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
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

function StatPill({ value, label, color }: { value: number | null | undefined; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <span className="text-base font-bold font-mono leading-none" style={{ color }}>{value ?? 0}</span>
      <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

interface Credentials { full_name: string; participant_code: string; password: string }

export default function ParticipantTable({ participants }: { participants: ParticipantWithStats[] }) {
  const [modal, setModal] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [applications, setApplications] = useState<Record<string, ApplicationRecord[]>>({})
  const [appsLoading, setAppsLoading] = useState<string | null>(null)

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

  async function toggleExpand(participantId: string) {
    if (expanded === participantId) { setExpanded(null); return }
    setExpanded(participantId)
    if (applications[participantId]) return
    setAppsLoading(participantId)
    const res = await fetch(`/api/coordinator/applications/${participantId}`)
    const data = await res.json()
    setApplications(prev => ({ ...prev, [participantId]: data.applications ?? [] }))
    setAppsLoading(null)
  }

  async function verifyApplication(participantId: string, applicationId: string, verified: boolean) {
    await fetch(`/api/coordinator/applications/${participantId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ applicationId, verified }),
    })
    setApplications(prev => ({
      ...prev,
      [participantId]: prev[participantId].map(a => a.id === applicationId ? { ...a, verified } : a),
    }))
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
              {['Name / Code', 'Linguu-Fortschritt', 'Diese Woche', 'Bewerbungen', 'Zuletzt aktiv', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <>
                <tr key={p.id}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ borderBottom: `1px solid var(--border)` }}
                  onClick={() => toggleExpand(p.id)}>

                  {/* Name + Code + Level */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{p.full_name}</p>
                      {p.assessment_level && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: p.assessment_level.startsWith('A') ? 'rgba(239,68,68,0.12)' : p.assessment_level.startsWith('B') ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                            color: p.assessment_level.startsWith('A') ? '#ef4444' : p.assessment_level.startsWith('B') ? '#f59e0b' : '#22c55e',
                          }}>
                          {p.assessment_level}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                      style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                      {p.participant_code}
                    </span>
                  </td>

                  {/* Linguu XP + Lektionen */}
                  <td className="px-6 py-4 min-w-44">
                    <XpBar xp={p.total_xp} />
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {p.lessons_completed} Lektionen gesamt
                    </p>
                  </td>

                  {/* Diese Woche */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs" title="Lektionen diese Woche">
                        <BookOpen size={11} style={{ color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--text)' }}>{p.lessons_this_week ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" title="Bewerbungen diese Woche">
                        <Briefcase size={11} style={{ color: '#f59e0b' }} />
                        <span style={{ color: 'var(--text)' }}>{p.applications_this_week ?? 0}</span>
                      </div>
                    </div>
                  </td>

                  {/* Bewerbungen */}
                  <td className="px-6 py-4">
                    {(p.total_applications ?? 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                          {p.total_applications}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          gesamt · {p.applications_this_month ?? 0} Monat
                        </span>
                        {(p.verified_applications ?? 0) > 0 && (
                          <ShieldCheck size={13} style={{ color: '#10b981' }} aria-label="Verifizierte Bewerbungen" />
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>–</span>
                    )}
                  </td>

                  {/* Zuletzt aktiv */}
                  <td className="px-6 py-4" style={{ color: p.last_active ? 'var(--success)' : 'var(--muted)' }}>
                    {formatDate(p.last_active)}
                  </td>

                  {/* Aktionen */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); resetPassword(p.id) }}
                        disabled={loading === p.id}
                        title="Passwort zurücksetzen"
                        className="p-1.5 rounded cursor-pointer transition-colors hover:bg-[var(--bg)]"
                        style={{ color: 'var(--muted)' }}>
                        {loading === p.id
                          ? <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <Key size={14} />}
                      </button>
                      <div style={{ color: 'var(--muted)' }}>
                        {expanded === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Expand: Bewerbungs-Detail + Linguu-Stats */}
                {expanded === p.id && (
                  <tr key={`${p.id}-detail`} style={{ background: 'var(--surface-raised)' }}>
                    <td colSpan={6} className="px-6 py-5">
                      <div className="grid grid-cols-2 gap-6">

                        {/* Linguu-Statistik */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: 'var(--primary)' }}>
                            Linguu-Fortschritt
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            <StatPill value={p.lessons_this_week} label="diese Woche" color="#6366f1" />
                            <StatPill value={p.lessons_this_month} label="diesen Monat" color="#6366f1" />
                            <StatPill value={p.xp_this_week} label="XP diese Woche" color="#f59e0b" />
                            {p.avg_quiz_score != null && (
                              <StatPill value={p.avg_quiz_score} label="Ø Quiz-Score" color="#10b981" />
                            )}
                          </div>
                        </div>

                        {/* Bewerbungen */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: '#f59e0b' }}>
                            Bewerbungen
                          </p>
                          {appsLoading === p.id ? (
                            <p className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>Lade…</p>
                          ) : !applications[p.id] || applications[p.id].length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Noch keine Bewerbungen getrackt.</p>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto">
                              {applications[p.id].map(app => (
                                <div key={app.id}
                                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-xs"
                                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">{app.job_title ?? 'Unbekannte Stelle'}</span>
                                      {app.company && (
                                        <span style={{ color: 'var(--muted)' }}>· {app.company}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1" style={{ color: 'var(--muted)' }}>
                                      <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatDateTime(app.applied_at ?? app.created_at)}
                                      </span>
                                      {app.email_proof && (
                                        <span className="flex items-center gap-1" style={{ color: '#6366f1' }}>
                                          ✉ {app.email_proof.slice(0, 40)}{app.email_proof.length > 40 ? '…' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {app.job_url && (
                                      <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                                        className="p-1 rounded hover:opacity-70" style={{ color: 'var(--muted)' }}>
                                        <ExternalLink size={11} />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => verifyApplication(p.id, app.id, !app.verified)}
                                      title={app.verified ? 'Als nicht verifiziert markieren' : 'Als verifiziert markieren'}
                                      className="p-1 rounded hover:opacity-70"
                                      style={{ color: app.verified ? '#10b981' : 'var(--muted)' }}>
                                      <ShieldCheck size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Passwort-Modal */}
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
                <span style={{ color: 'var(--muted)' }}>WID-Code</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{modal.participant_code}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--muted)' }}>Neues Passwort</span>
                <span className="font-mono font-bold">{modal.password}</span>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(`WID-Code: ${modal.participant_code}\nPasswort: ${modal.password}`)}
              className="btn-primary w-full justify-center mt-5 text-sm"
              style={{ padding: '0.625rem 1rem' }}>
              {copied ? <><Check size={14} /> Kopiert</> : <><Copy size={14} /> Kopieren</>}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--muted)' }}>
              Diesen Code auch für Linguu und JobMate verwenden.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
