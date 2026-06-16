'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Building2, Users, Euro, BookOpen, ChevronDown, ChevronUp,
  TrendingUp, AlertTriangle, CheckCircle2, Circle, Clock,
  Plus, Trash2, ArrowUpRight, Target, Activity, ListTodo,
  Flame, Zap, RefreshCw, FlaskConical, Copy, CheckCheck,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface OrgStat {
  org_id: string; org_name: string; org_created: string
  coordinator_count: number; participant_count: number
  total_cost_eur: number; last_activity: string | null
}
interface CostRow {
  app: string; day: string; request_count: number
  input_tokens: number; output_tokens: number
  tts_chars: number; whisper_secs: number; cost_eur: number
}
interface AssessmentRow {
  id: string; level: string; score: number; total: number
  duration_sec: number; completed_at: string
  profiles: { full_name: string; participant_code: string; organizations: { name: string } | null } | null
}
interface RevenueRow {
  org_id: string; org_name: string; active_participants: number; mrr_eur: number; last_activity: string | null
}
interface CompletionRow {
  org_id: string; org_name: string; total_participants: number
  fully_completed: number; avg_topics_completed: number; inactive_participants: number
}
interface WeeklyRow { week: string; active_users: number; total_xp_earned: number; lessons_done: number }
interface Topline {
  total_orgs: number; total_participants: number; active_last_7d: number; active_last_30d: number
  total_applications: number; total_assessments: number; total_mrr_eur: number
}
interface PipelineRow {
  id: string; name: string; contact_name: string | null; contact_email: string | null
  contact_phone: string | null; status: string; participant_count_target: number
  price_per_participant: number; notes: string | null; next_followup: string | null; created_at: string
}
interface Todo {
  id: string; title: string; description: string | null; status: string
  priority: string; category: string; due_date: string | null; created_at: string
}
interface Stats {
  orgs: OrgStat[]; costByApp: CostRow[]; recentAssessments: AssessmentRow[]
  totalCostEurMonth: number; revenueByOrg: RevenueRow[]; completionStats: CompletionRow[]
  weeklyActivity: WeeklyRow[]; topline: Topline | null
  todoStats: { open: number; critical: number }; pipeline: PipelineRow[]; pipelineMRR: number
}

// ── Colors ──────────────────────────────────────────────────────
const APP_COLORS: Record<string, string> = { wid: '#6366f1', linguu: '#10b981', jobmate: '#f59e0b' }
const PRIORITY_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#8b8fa8' }
const STATUS_LABEL: Record<string, string> = {
  prospect: 'Interessent', demo_scheduled: 'Demo geplant', demo_done: 'Demo fertig',
  proposal_sent: 'Angebot verschickt', signed: 'Unterzeichnet', churned: 'Verloren',
}
const STATUS_COLOR: Record<string, string> = {
  prospect: '#8b8fa8', demo_scheduled: '#f59e0b', demo_done: '#6366f1',
  proposal_sent: '#ec4899', signed: '#10b981', churned: '#ef4444',
}
const TODO_CATEGORY_COLOR: Record<string, string> = {
  tech: '#6366f1', business: '#10b981', product: '#f59e0b', general: '#8b8fa8',
}

type Tab = 'overview' | 'pipeline' | 'todos' | 'orgs' | 'assessments' | 'costs' | 'test'

// ── Main Component ──────────────────────────────────────────────
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [pipeline, setPipeline] = useState<PipelineRow[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [statsRes, todosRes, pipelineRes] = await Promise.all([
      fetch('/api/admin/stats').then(r => r.json()).catch(() => null),
      fetch('/api/admin/todos').then(r => r.json()).catch(() => []),
      fetch('/api/admin/pipeline').then(r => r.json()).catch(() => []),
    ])
    if (statsRes) setStats(statsRes)
    setTodos(Array.isArray(todosRes) ? todosRes : [])
    setPipeline(Array.isArray(pipelineRes) ? pipelineRes : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm animate-pulse" style={{ color: 'var(--muted)' }}>
          <RefreshCw size={14} className="animate-spin" /> Lade Daten…
        </div>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'pipeline', label: 'Pipeline', badge: pipeline.filter(p => p.status !== 'churned').length },
    { id: 'todos', label: 'To-Dos', badge: todos.filter(t => t.status !== 'done' && t.priority === 'critical').length },
    { id: 'orgs', label: 'Organisationen', badge: stats?.orgs.length },
    { id: 'assessments', label: 'Assessments' },
    { id: 'costs', label: 'API-Kosten' },
    { id: 'test', label: 'Test-Zugang' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Admin</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Enter · Linguu · JobMate — zentrales Cockpit
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <RefreshCw size={12} /> Aktualisieren
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative"
            style={{
              color: tab === id ? 'var(--primary)' : 'var(--muted)',
              borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: id === 'todos' ? '#ef444420' : 'var(--surface-raised)', color: id === 'todos' ? '#ef4444' : 'var(--muted)' }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && <OverviewTab stats={stats} />}
      {tab === 'pipeline' && <PipelineTab pipeline={pipeline} setPipeline={setPipeline} />}
      {tab === 'todos' && <TodosTab todos={todos} setTodos={setTodos} />}
      {tab === 'orgs' && <OrgsTab orgs={stats?.orgs ?? []} expanded={expanded} setExpanded={setExpanded} />}
      {tab === 'assessments' && <AssessmentsTab assessments={stats?.recentAssessments ?? []} />}
      {tab === 'costs' && <CostsTab costByApp={stats?.costByApp ?? []} totalMonth={stats?.totalCostEurMonth ?? 0} />}
      {tab === 'test' && <TestTab orgs={stats?.orgs ?? []} />}
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) return null
  const t = stats.topline
  const totalMRR = stats.revenueByOrg.reduce((s, r) => s + Number(r.mrr_eur), 0)
  const totalCompleted = stats.completionStats.reduce((s, c) => s + c.fully_completed, 0)
  const totalParticipants = stats.completionStats.reduce((s, c) => s + c.total_participants, 0)
  const completionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0
  const totalInactive = stats.completionStats.reduce((s, c) => s + c.inactive_participants, 0)

  const kpis = [
    { label: 'MRR', value: `€${totalMRR.toFixed(0)}`, sub: `+Pipeline: €${stats.pipelineMRR.toFixed(0)}`, icon: Euro, color: '#10b981' },
    { label: 'Organisationen', value: t?.total_orgs ?? stats.orgs.length, sub: `${stats.pipeline.filter(p => p.status === 'signed').length} signed`, icon: Building2, color: '#6366f1' },
    { label: 'Teilnehmer', value: t?.total_participants ?? 0, sub: `${t?.active_last_7d ?? 0} aktiv (7 Tage)`, icon: Users, color: '#2563EB' },
    { label: 'Abschlussquote', value: `${completionRate}%`, sub: `${totalCompleted} / ${totalParticipants} fertig`, icon: Target, color: '#f59e0b' },
    { label: 'Aktiv (30 Tage)', value: t?.active_last_30d ?? 0, sub: `${totalInactive} inaktiv (21d+)`, icon: Activity, color: '#ec4899' },
    { label: 'Bewerbungen', value: t?.total_applications ?? 0, sub: 'via JobMate getrackt', icon: TrendingUp, color: '#f97316' },
    { label: 'Assessments', value: t?.total_assessments ?? 0, sub: 'Sprachtests abgeschlossen', icon: BookOpen, color: '#8b5cf6' },
    { label: 'API-Kosten (Monat)', value: `€${stats.totalCostEurMonth.toFixed(4)}`, sub: 'Anthropic + OpenAI', icon: Zap, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'Fira Code, monospace' }}>{value}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--foreground)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue by org */}
      {stats.revenueByOrg.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Revenue nach Organisation</h2>
          <div className="space-y-3">
            {stats.revenueByOrg.map(r => {
              const pct = totalMRR > 0 ? (Number(r.mrr_eur) / totalMRR) * 100 : 0
              return (
                <div key={r.org_id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.org_name}</span>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>{r.active_participants} TN</span>
                      <span className="font-bold font-mono" style={{ color: '#10b981' }}>€{Number(r.mrr_eur).toFixed(0)}/Monat</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#10b981' }} />
                  </div>
                </div>
              )
            })}
            {stats.revenueByOrg.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine aktiven Organisationen.</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold">Gesamt MRR</span>
            <span className="text-xl font-bold font-mono" style={{ color: '#10b981' }}>€{totalMRR.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Completion Stats */}
      {stats.completionStats.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-semibold">Abschluss & Engagement</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <th className="px-6 py-3 text-left">Organisation</th>
                <th className="px-4 py-3 text-right">Teilnehmer</th>
                <th className="px-4 py-3 text-right">Abgeschlossen</th>
                <th className="px-4 py-3 text-right">Ø Themen</th>
                <th className="px-4 py-3 text-right">Inaktiv (21d+)</th>
              </tr>
            </thead>
            <tbody>
              {stats.completionStats.map(c => {
                const rate = c.total_participants > 0 ? Math.round((c.fully_completed / c.total_participants) * 100) : 0
                return (
                  <tr key={c.org_id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-6 py-3 font-medium">{c.org_name}</td>
                    <td className="px-4 py-3 text-right">{c.total_participants}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold" style={{ color: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : 'var(--muted)' }}>
                        {c.fully_completed} ({rate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{c.avg_topics_completed}/8</td>
                    <td className="px-4 py-3 text-right">
                      {c.inactive_participants > 0 ? (
                        <span className="flex items-center justify-end gap-1" style={{ color: '#ef4444' }}>
                          <AlertTriangle size={12} /> {c.inactive_participants}
                        </span>
                      ) : (
                        <span style={{ color: '#10b981' }}>✓</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Weekly Activity sparkline */}
      {stats.weeklyActivity.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Wöchentliche Aktivität</h2>
          <div className="flex items-end gap-1 h-24">
            {[...stats.weeklyActivity].reverse().slice(-12).map((w, i) => {
              const maxUsers = Math.max(...stats.weeklyActivity.map(x => x.active_users), 1)
              const pct = (w.active_users / maxUsers) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full rounded-t transition-all" title={`${w.active_users} Nutzer · ${w.lessons_done} Lektionen`}
                    style={{ height: `${Math.max(pct, 4)}%`, background: 'var(--primary)', opacity: 0.7 + i * 0.025 }} />
                  <span className="text-xs" style={{ color: 'var(--muted)', fontSize: 9, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                    {new Date(w.week).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pipeline Tab ────────────────────────────────────────────────
const PIPELINE_STATUSES = ['prospect', 'demo_scheduled', 'demo_done', 'proposal_sent', 'signed', 'churned'] as const

function PipelineTab({ pipeline, setPipeline }: { pipeline: PipelineRow[]; setPipeline: (p: PipelineRow[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', contact_name: '', contact_email: '', contact_phone: '', participant_count_target: '0', notes: '', next_followup: '' })

  async function addEntry() {
    if (!form.name.trim()) return
    const res = await fetch('/api/admin/pipeline', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, participant_count_target: parseInt(form.participant_count_target) || 0 }),
    })
    const data = await res.json()
    if (res.ok) {
      setPipeline([data, ...pipeline])
      setAdding(false)
      setForm({ name: '', contact_name: '', contact_email: '', contact_phone: '', participant_count_target: '0', notes: '', next_followup: '' })
    }
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/admin/pipeline/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPipeline(pipeline.map(p => p.id === id ? { ...p, status } : p))
  }

  async function remove(id: string) {
    await fetch(`/api/admin/pipeline/${id}`, { method: 'DELETE' })
    setPipeline(pipeline.filter(p => p.id !== id))
  }

  const byStatus = PIPELINE_STATUSES.reduce<Record<string, PipelineRow[]>>((acc, s) => {
    acc[s] = pipeline.filter(p => p.status === s)
    return acc
  }, {} as Record<string, PipelineRow[]>)

  const potentialMRR = pipeline
    .filter(p => p.status !== 'churned')
    .reduce((s, p) => s + (p.participant_count_target * Number(p.price_per_participant)), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Outreach Pipeline</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Potenzielle MRR: <span className="font-bold font-mono" style={{ color: '#10b981' }}>€{potentialMRR.toFixed(0)}</span>
          </p>
        </div>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{ background: 'var(--primary)', color: 'white' }}>
          <Plus size={14} /> Neuer Eintrag
        </button>
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-sm">Neue Organisation</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Name *', placeholder: 'z.B. Caritas München' },
              { key: 'contact_name', label: 'Ansprechpartner', placeholder: 'Max Mustermann' },
              { key: 'contact_email', label: 'E-Mail', placeholder: 'max@caritas.de' },
              { key: 'contact_phone', label: 'Telefon', placeholder: '+49 89 ...' },
              { key: 'participant_count_target', label: 'Ziel-Teilnehmer', placeholder: '25' },
              { key: 'next_followup', label: 'Nächster Follow-Up', placeholder: '', type: 'date' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
                <input type={type ?? 'text'} placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Notizen</label>
            <textarea placeholder="Erstgespräch Notes, besondere Anforderungen..." rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addEntry} className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: 'var(--primary)', color: 'white' }}>Hinzufügen</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Status Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {PIPELINE_STATUSES.filter(s => s !== 'churned').map(status => (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {STATUS_LABEL[status]}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}>
                {byStatus[status]?.length ?? 0}
              </span>
            </div>
            {(byStatus[status] ?? []).map(entry => (
              <div key={entry.id} className="card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{entry.name}</p>
                  <button onClick={() => remove(entry.id)} className="text-xs cursor-pointer flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {entry.contact_name && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{entry.contact_name}</p>
                )}
                {entry.contact_email && (
                  <p className="text-xs font-mono" style={{ color: 'var(--primary)' }}>{entry.contact_email}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {entry.participant_count_target} TN · €{(entry.participant_count_target * Number(entry.price_per_participant)).toFixed(0)}/Monat
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs italic" style={{ color: 'var(--muted)' }}>{entry.notes}</p>
                )}
                {entry.next_followup && (
                  <p className="text-xs" style={{ color: '#f59e0b' }}>
                    📅 {new Date(entry.next_followup).toLocaleDateString('de-DE')}
                  </p>
                )}
                <select value={entry.status} onChange={e => changeStatus(entry.id, e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded cursor-pointer outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: STATUS_COLOR[entry.status] }}>
                  {PIPELINE_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            ))}
            {(byStatus[status] ?? []).length === 0 && (
              <div className="rounded-xl border-2 border-dashed h-16 flex items-center justify-center"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Leer</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Todos Tab ────────────────────────────────────────────────────
function TodosTab({ todos, setTodos }: { todos: Todo[]; setTodos: (t: Todo[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' })

  async function addTodo() {
    if (!form.title.trim()) return
    const res = await fetch('/api/admin/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, due_date: form.due_date || null }),
    })
    const data = await res.json()
    if (res.ok) {
      setTodos([data, ...todos])
      setAdding(false)
      setForm({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' })
    }
  }

  async function cycleStatus(todo: Todo) {
    const next = todo.status === 'open' ? 'in_progress' : todo.status === 'in_progress' ? 'done' : 'open'
    await fetch(`/api/admin/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setTodos(todos.map(t => t.id === todo.id ? { ...t, status: next } : t))
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/admin/todos/${id}`, { method: 'DELETE' })
    setTodos(todos.filter(t => t.id !== id))
  }

  const grouped = (['critical', 'high', 'medium', 'low'] as const).reduce<Record<string, Todo[]>>((acc, p) => {
    acc[p] = todos.filter(t => t.priority === p && t.status !== 'done')
    return acc
  }, {} as Record<string, Todo[]>)
  const done = todos.filter(t => t.status === 'done')

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'done') return <CheckCircle2 size={16} style={{ color: '#10b981' }} />
    if (status === 'in_progress') return <Clock size={16} style={{ color: '#f59e0b' }} />
    return <Circle size={16} style={{ color: 'var(--muted)' }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">To-Do Liste</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {todos.filter(t => t.status !== 'done').length} offen · {done.length} erledigt
          </p>
        </div>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          style={{ background: 'var(--primary)', color: 'white' }}>
          <Plus size={14} /> Neues To-Do
        </button>
      </div>

      {adding && (
        <div className="card space-y-3">
          <input placeholder="Titel *"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-medium"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          <textarea placeholder="Beschreibung (optional)" rows={2}
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          <div className="flex gap-3">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: PRIORITY_COLOR[form.priority] }}>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟡 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}>
              <option value="tech">Tech</option>
              <option value="business">Business</option>
              <option value="product">Product</option>
              <option value="general">General</option>
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addTodo} className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: 'var(--primary)', color: 'white' }}>Hinzufügen</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Abbrechen</button>
          </div>
        </div>
      )}

      {(['critical', 'high', 'medium', 'low'] as const).map(priority => {
        const items = grouped[priority]
        if (!items?.length) return null
        const LABELS: Record<string, string> = { critical: '🔴 Critical', high: '🟡 High', medium: '🔵 Medium', low: '⚪ Low' }
        return (
          <div key={priority}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: PRIORITY_COLOR[priority] }}>
                {LABELS[priority]}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>· {items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(todo => (
                <div key={todo.id} className="card p-4 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${PRIORITY_COLOR[todo.priority]}` }}>
                  <button onClick={() => cycleStatus(todo)} className="flex-shrink-0 mt-0.5 cursor-pointer">
                    <StatusIcon status={todo.status} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ textDecoration: todo.status === 'done' ? 'line-through' : 'none', color: todo.status === 'done' ? 'var(--muted)' : 'var(--foreground)' }}>
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)' }}>{todo.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${TODO_CATEGORY_COLOR[todo.category]}15`, color: TODO_CATEGORY_COLOR[todo.category] }}>
                        {todo.category}
                      </span>
                      {todo.due_date && (
                        <span className="text-xs" style={{ color: '#f59e0b' }}>
                          📅 {new Date(todo.due_date).toLocaleDateString('de-DE')}
                        </span>
                      )}
                      {todo.status === 'in_progress' && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                          In Arbeit
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="flex-shrink-0 cursor-pointer" style={{ color: 'var(--muted)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--muted)' }}>
            ✓ Erledigt ({done.length})
          </summary>
          <div className="space-y-1 mt-2">
            {done.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 px-4 py-2 rounded-lg"
                style={{ background: 'var(--surface-raised)' }}>
                <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                <span className="text-sm flex-1" style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)} style={{ color: 'var(--muted)' }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ── Orgs Tab ────────────────────────────────────────────────────
function OrgsTab({ orgs, expanded, setExpanded }: { orgs: OrgStat[]; expanded: string | null; setExpanded: (id: string | null) => void }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-base font-semibold">Alle Organisationen</h2>
      </div>
      {orgs.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>Keine Organisationen.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <th className="px-6 py-3 text-left">Organisation</th>
              <th className="px-4 py-3 text-right">Koordinatoren</th>
              <th className="px-4 py-3 text-right">Teilnehmer</th>
              <th className="px-4 py-3 text-right">API-Kosten</th>
              <th className="px-4 py-3 text-right">Zuletzt aktiv</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <>
                <tr key={org.org_id} className="border-b cursor-pointer hover:opacity-80"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => setExpanded(expanded === org.org_id ? null : org.org_id)}>
                  <td className="px-6 py-4 font-medium">{org.org_name}</td>
                  <td className="px-4 py-4 text-right" style={{ color: 'var(--muted)' }}>{org.coordinator_count}</td>
                  <td className="px-4 py-4 text-right">{org.participant_count}</td>
                  <td className="px-4 py-4 text-right font-mono text-xs">€{Number(org.total_cost_eur).toFixed(4)}</td>
                  <td className="px-4 py-4 text-right text-xs" style={{ color: 'var(--muted)' }}>
                    {org.last_activity ? new Date(org.last_activity).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="px-4 py-4 text-right" style={{ color: 'var(--muted)' }}>
                    {expanded === org.org_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                </tr>
                {expanded === org.org_id && (
                  <tr key={`${org.org_id}-detail`} style={{ background: 'var(--surface-raised)' }}>
                    <td colSpan={6} className="px-6 py-4">
                      <OrgDetail orgId={org.org_id} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Assessments Tab ─────────────────────────────────────────────
function AssessmentsTab({ assessments }: { assessments: AssessmentRow[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-base font-semibold">Sprach-Assessments ({assessments.length})</h2>
      </div>
      {assessments.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>Noch keine Assessments.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <th className="px-6 py-3 text-left">Teilnehmer</th>
              <th className="px-4 py-3 text-left">Organisation</th>
              <th className="px-4 py-3 text-center">Level</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Datum</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-6 py-3">
                  <span className="font-medium">{a.profiles?.full_name ?? '—'}</span>
                  <span className="text-xs ml-2 font-mono" style={{ color: 'var(--muted)' }}>{a.profiles?.participant_code}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{a.profiles?.organizations?.name ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#6366f120', color: '#6366f1' }}>{a.level}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{a.score}/{a.total}</td>
                <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(a.completed_at).toLocaleDateString('de-DE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Costs Tab ───────────────────────────────────────────────────
function CostsTab({ costByApp, totalMonth }: { costByApp: CostRow[]; totalMonth: number }) {
  const perApp = costByApp.reduce<Record<string, number>>((acc, row) => {
    acc[row.app] = (acc[row.app] ?? 0) + Number(row.cost_eur)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-base font-semibold mb-4">API-Kosten nach App (gesamt)</h2>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(perApp).map(([app, cost]) => (
            <div key={app} className="flex items-center gap-2 px-4 py-3 rounded-lg"
              style={{ background: `${APP_COLORS[app] ?? '#888'}15`, border: `1px solid ${APP_COLORS[app] ?? '#888'}40` }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: APP_COLORS[app] ?? '#888' }}>{app}</span>
              <span className="text-lg font-bold font-mono">€{cost.toFixed(4)}</span>
            </div>
          ))}
          {Object.keys(perApp).length === 0 && (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine API-Aufrufe getrackt.</p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Diesen Monat</span>
          <span className="font-bold font-mono">€{totalMonth.toFixed(4)}</span>
        </div>
      </div>

      {costByApp.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-base font-semibold">Täglicher Verlauf</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <th className="px-6 py-2 text-left">App</th>
                <th className="px-4 py-2 text-left">Tag</th>
                <th className="px-4 py-2 text-right">Anfragen</th>
                <th className="px-4 py-2 text-right">Input Tokens</th>
                <th className="px-4 py-2 text-right">Output Tokens</th>
                <th className="px-4 py-2 text-right">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {costByApp.slice(0, 30).map((row, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-6 py-2">
                    <span className="font-bold" style={{ color: APP_COLORS[row.app] ?? '#888' }}>{row.app}</span>
                  </td>
                  <td className="px-4 py-2 font-mono" style={{ color: 'var(--muted)' }}>
                    {new Date(row.day).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-2 text-right">{row.request_count}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.input_tokens?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.output_tokens?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono">€{Number(row.cost_eur).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── OrgDetail (lazy) ────────────────────────────────────────────
function OrgDetail({ orgId }: { orgId: string }) {
  const [participants, setParticipants] = useState<{
    id: string; full_name: string; participant_code: string; native_language: string
    total_xp: number; lessons_completed: number; last_active: string | null; jobs_saved: number
  }[] | null>(null)

  useEffect(() => {
    fetch(`/api/admin/org/${orgId}/participants`)
      .then(r => r.json())
      .then(d => setParticipants(d.participants ?? []))
      .catch(console.error)
  }, [orgId])

  if (!participants) return <p className="text-xs animate-pulse" style={{ color: 'var(--muted)' }}>Lade…</p>
  if (participants.length === 0) return <p className="text-xs" style={{ color: 'var(--muted)' }}>Keine Teilnehmer.</p>

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>{participants.length} Teilnehmer</p>
      <div className="grid gap-1">
        {participants.map(p => (
          <div key={p.id} className="flex items-center gap-4 text-xs py-1">
            <span className="font-medium w-40 truncate">{p.full_name}</span>
            <span className="font-mono" style={{ color: 'var(--muted)' }}>{p.participant_code}</span>
            <span className="ml-auto font-mono">{p.total_xp} XP</span>
            <span style={{ color: 'var(--muted)' }}>{p.lessons_completed} Lektionen</span>
            <span style={{ color: 'var(--muted)' }}>{p.jobs_saved} Jobs</span>
            <span style={{ color: 'var(--muted)' }}>
              {p.last_active ? new Date(p.last_active).toLocaleDateString('de-DE') : 'Inaktiv'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Test-Zugang Tab ────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
  ar: 'Arabisch', uk: 'Ukrainisch', es: 'Spanisch', en: 'Englisch',
  ku: 'Kurdisch', tr: 'Türkisch', pl: 'Polnisch', ro: 'Rumänisch', ru: 'Russisch',
}

interface CreatedParticipant { participant_code: string; password: string; full_name: string }
interface LocalOrg { org_id: string; org_name: string }

function TestTab({ orgs: initialOrgs }: { orgs: OrgStat[] }) {
  const [orgs, setOrgs] = useState<LocalOrg[]>(initialOrgs.map(o => ({ org_id: o.org_id, org_name: o.org_name })))
  const [orgName, setOrgName] = useState('Test-Organisation')
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)

  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [lang, setLang] = useState('ar')
  const [orgId, setOrgId] = useState(initialOrgs[0]?.org_id ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreatedParticipant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'code' | 'pw' | null>(null)

  const createOrg = async () => {
    if (!orgName.trim()) return
    setOrgLoading(true)
    setOrgError(null)
    try {
      const res = await fetch('/api/admin/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler')
      const newOrg = { org_id: data.id, org_name: data.name }
      setOrgs(prev => [...prev, newOrg])
      setOrgId(data.id)
    } catch (e: unknown) {
      setOrgError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setOrgLoading(false)
    }
  }

  const create = async () => {
    if (!vorname.trim() || !nachname.trim() || !orgId) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/create-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${vorname.trim()} ${nachname.trim()}`,
          native_language: lang,
          org_id: orgId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')
      setResult(data)
      setVorname('')
      setNachname('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, type: 'code' | 'pw') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-lg space-y-6">

      {/* Org anlegen falls keine vorhanden */}
      {orgs.length === 0 && (
        <div className="card space-y-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-semibold">Schritt 1: Organisation anlegen</h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Noch keine Organisation vorhanden. Leg eine Test-Org an, bevor du Teilnehmer erstellen kannst.
          </p>
          <div className="flex gap-2">
            <input
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Test-Organisation"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button
              onClick={createOrg}
              disabled={orgLoading || !orgName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {orgLoading ? '…' : 'Anlegen'}
            </button>
          </div>
          {orgError && <p className="text-xs" style={{ color: '#dc2626' }}>{orgError}</p>}
        </div>
      )}

      {/* Teilnehmer Formular */}
      <div className="card space-y-4" style={{ opacity: orgs.length === 0 ? 0.4 : 1 }}>
        <div className="flex items-center gap-2">
          <FlaskConical size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="text-base font-semibold">
            {orgs.length === 0 ? 'Schritt 2: ' : ''}Teilnehmer anlegen
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Enter-Code + Passwort werden automatisch generiert und angezeigt.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Vorname</label>
            <input
              value={vorname}
              onChange={e => setVorname(e.target.value)}
              placeholder="Max"
              disabled={orgs.length === 0}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Nachname</label>
            <input
              value={nachname}
              onChange={e => setNachname(e.target.value)}
              placeholder="Mustermann"
              disabled={orgs.length === 0}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Sprache</label>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              disabled={orgs.length === 0}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {Object.entries(LANG_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Organisation</label>
            <select
              value={orgId}
              onChange={e => setOrgId(e.target.value)}
              disabled={orgs.length === 0}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {orgs.map(o => (
                <option key={o.org_id} value={o.org_id}>{o.org_name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={create}
          disabled={loading || !vorname.trim() || !nachname.trim() || !orgId}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          {loading ? 'Wird angelegt…' : 'Teilnehmer anlegen'}
        </button>

        {error && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="card space-y-4 border-2" style={{ borderColor: '#10b981' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#10b981' }}>Teilnehmer angelegt</h3>
          </div>
          <p className="font-semibold">{result.full_name}</p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Enter-Code</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 rounded-lg font-mono text-base font-bold tracking-widest"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
                  {result.participant_code}
                </span>
                <button onClick={() => copy(result.participant_code, 'code')}
                  className="p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: copied === 'code' ? '#10b98120' : 'var(--surface-2)', color: copied === 'code' ? '#10b981' : 'var(--muted)' }}>
                  {copied === 'code' ? <CheckCheck size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Passwort</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 rounded-lg font-mono text-base font-bold"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
                  {result.password}
                </span>
                <button onClick={() => copy(result.password, 'pw')}
                  className="p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: copied === 'pw' ? '#10b98120' : 'var(--surface-2)', color: copied === 'pw' ? '#10b981' : 'var(--muted)' }}>
                  {copied === 'pw' ? <CheckCheck size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Login unter <span className="font-mono">wid.techstag.de/login</span> → Tab „Teilnehmer" → Code + Passwort eingeben
          </p>
        </div>
      )}
    </div>
  )
}
