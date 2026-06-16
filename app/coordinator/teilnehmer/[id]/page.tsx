import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, BookOpen, Landmark, Briefcase, CalendarCheck,
  TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import CoordinatorStamp from '@/components/coordinator/CoordinatorStamp'

export const dynamic = 'force-dynamic'

function monthRange(offset = 0) {
  const start = new Date()
  start.setMonth(start.getMonth() + offset, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function Delta({ now, prev }: { now: number; prev: number }) {
  const diff = now - prev
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus
  const color = diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--warning)' : 'var(--muted)'
  const label = diff === 0 ? 'wie Vormonat' : `${diff > 0 ? '+' : ''}${diff} vs. Vormonat`
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon size={12} /> {label}
    </span>
  )
}

function Stat({ value, label, color = 'var(--primary)' }: { value: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="flex flex-col px-3 py-2.5 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <span className="text-2xl font-bold font-mono leading-none" style={{ color }}>{value}</span>
      <span className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

function Card({ icon: Icon, color, title, children }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  color: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  applied:  { label: 'Beworben',  color: '#6366f1' },
  invited:  { label: 'Einladung', color: '#10b981' },
  offer:    { label: 'Angebot',   color: '#22c55e' },
  rejected: { label: 'Absage',    color: '#ef4444' },
}

export default async function ParticipantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: me } = await db.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!me) redirect('/login')

  const { data: p } = await db
    .from('profiles')
    .select('id, full_name, participant_code, native_language, organization_id, created_at')
    .eq('id', id)
    .eq('role', 'participant')
    .single()
  if (!p) notFound()

  // Zugriffsschutz: Koordinator nur eigene Org (global_admin sieht alle)
  if (me.role !== 'global_admin' && p.organization_id !== me.organization_id) notFound()

  const thisM = monthRange(0)
  const prevM = monthRange(-1)

  // ── Sprache (Linguu) ──────────────────────────────────────────
  const { data: linguu } = await db.from('linguu_weekly_stats').select('*').eq('user_id', id).maybeSingle()
  const { count: lessonsPrevMonth } = await db
    .from('linguu_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)
    .gte('completed_at', prevM.start).lt('completed_at', prevM.end)

  // ── Einbürgerung (assessment_results, Marker eb_) ─────────────
  const { data: ebSessions } = await db
    .from('assessment_results')
    .select('score, total, duration_sec, created_at')
    .eq('user_id', id)
    .like('session_id', 'eb_%')
    .order('created_at', { ascending: false })
  const ebCount = ebSessions?.length ?? 0
  const ebMinutes = Math.round((ebSessions?.reduce((s, r) => s + (r.duration_sec ?? 0), 0) ?? 0) / 60)
  const ebBest = ebSessions?.reduce((m, r) => Math.max(m, r.total ? Math.round((r.score / r.total) * 100) : 0), 0) ?? 0

  // ── Jobs (JobMate) ────────────────────────────────────────────
  const { data: jobActivity } = await db
    .from('jobmate_activity')
    .select('activity_type, outcome, job_title, company, applied_at, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  const favs = jobActivity?.filter(a => a.activity_type === 'job_saved').length ?? 0
  const apps = jobActivity?.filter(a => a.activity_type === 'application') ?? []
  const outcomeCounts: Record<string, number> = {}
  for (const a of apps) {
    const o = a.outcome ?? 'applied'
    outcomeCounts[o] = (outcomeCounts[o] ?? 0) + 1
  }

  // ── Anwesenheit ───────────────────────────────────────────────
  const { data: att } = await db.from('attendance_stats').select('*').eq('user_id', id).maybeSingle()
  const { data: recentAtt } = await db
    .from('attendance')
    .select('date, check_in, check_out, was_late')
    .eq('user_id', id)
    .order('date', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <Link href="/coordinator" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
        <ArrowLeft size={15} /> Zurück zur Übersicht
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'var(--primary)' }}>
          {(p.full_name ?? '?').charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl leading-none">{p.full_name}</h1>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded mt-1.5 inline-block" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
            {p.participant_code}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sprache */}
        <Card icon={BookOpen} color="#6366f1" title="Spracherwerb (Linguu)">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat value={linguu?.lessons_this_month ?? 0} label="Lektionen / Monat" color="#6366f1" />
            <Stat value={linguu?.xp_this_month ?? 0} label="XP / Monat" color="#f59e0b" />
            <Stat value={linguu?.avg_quiz_score != null ? `${linguu.avg_quiz_score}%` : '–'} label="Ø Quiz-Score" color="#10b981" />
          </div>
          <Delta now={linguu?.lessons_this_month ?? 0} prev={lessonsPrevMonth ?? 0} />
        </Card>

        {/* Einbürgerung */}
        <Card icon={Landmark} color="#8b5cf6" title="Einbürgerungstest-Training">
          <div className="grid grid-cols-3 gap-3">
            <Stat value={ebCount} label="Übungs-Durchläufe" color="#8b5cf6" />
            <Stat value={`${ebMinutes} min`} label="Lernzeit gesamt" color="#6366f1" />
            <Stat value={ebBest ? `${ebBest}%` : '–'} label="Bestes Ergebnis" color="#10b981" />
          </div>
        </Card>

        {/* Jobs */}
        <Card icon={Briefcase} color="#f59e0b" title="Arbeitssuche (JobMate)">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat value={favs} label="Stellen favorisiert" color="#f59e0b" />
            <Stat value={apps.length} label="Bewerbungen" color="#ef4444" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Ergebnis der Bewerbungen</p>
          <div className="flex flex-wrap gap-2">
            {apps.length === 0 ? (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine Bewerbungen.</span>
            ) : (
              Object.entries(OUTCOME_LABELS).map(([key, { label, color }]) => (
                <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
                  <span className="font-bold font-mono">{outcomeCounts[key] ?? 0}</span> {label}
                </span>
              ))
            )}
          </div>
        </Card>

        {/* Anwesenheit */}
        <Card icon={CalendarCheck} color="#10b981" title="Anwesenheit & Pünktlichkeit">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat value={att?.days_present ?? 0} label="Tage anwesend" color="#10b981" />
            <Stat value={att?.punctuality_pct != null ? `${att.punctuality_pct}%` : '–'} label="Pünktlichkeit" color="#6366f1" />
            <Stat value={att?.avg_hours != null ? `${att.avg_hours} h` : '–'} label="Ø Dauer/Tag" color="#f59e0b" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Letzte Tage</p>
          <div className="space-y-1.5">
            {(recentAtt ?? []).length === 0 ? (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Noch keine Stempelungen.</span>
            ) : (
              recentAtt!.map(a => (
                <div key={a.date} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span>{new Date(a.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                  <span className="flex items-center gap-3" style={{ color: 'var(--muted)' }}>
                    <span className="flex items-center gap-1"><Clock size={11} />
                      {a.check_in ? new Date(a.check_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–'}
                      {a.check_out ? `–${new Date(a.check_out).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                    {a.was_late
                      ? <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                      : <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
                  </span>
                </div>
              ))
            )}
          </div>
          <CoordinatorStamp participantId={p.id} />
        </Card>
      </div>
    </div>
  )
}
