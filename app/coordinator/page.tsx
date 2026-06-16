import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Briefcase, TrendingUp, Plus, Clock, CheckCircle2, AlertTriangle, Circle } from 'lucide-react'
import type { ParticipantWithStats } from '@/types'
import ParticipantTable from '@/components/coordinator/ParticipantTable'

export default async function CoordinatorDashboard() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'global_admin') redirect('/admin')

  // participant_report View enthält Linguu + JobMate Stats (nach Migration 003)
  // Fallback auf participant_stats wenn View noch nicht existiert
  let participants: ParticipantWithStats[] | null = null
  const reportResult = await db
    .from('participant_report')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('last_linguu_active', { ascending: false, nullsFirst: false })
  if (!reportResult.error) {
    participants = reportResult.data as ParticipantWithStats[]
  } else {
    const fallback = await db
      .from('participant_stats')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('last_active', { ascending: false, nullsFirst: false })
    participants = fallback.data as ParticipantWithStats[]
  }

  // Assessment-Level pro Teilnehmer (neuestes Ergebnis)
  const userIds = (participants ?? []).map(p => p.id)
  let assessmentMap: Record<string, string> = {}
  let jobsSavedMonthMap: Record<string, number> = {}
  let cvUpdatesMonthMap: Record<string, number> = {}
  if (userIds.length > 0) {
    const { data: assessments } = await db
      .from('assessment_results')
      .select('user_id, level, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
    if (assessments) {
      for (const a of assessments) {
        if (!assessmentMap[a.user_id]) assessmentMap[a.user_id] = a.level
      }
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { data: savedJobs } = await db
      .from('jobmate_activity')
      .select('user_id')
      .in('user_id', userIds)
      .eq('activity_type', 'job_saved')
      .gte('created_at', monthStart.toISOString())
    if (savedJobs) {
      for (const row of savedJobs) {
        jobsSavedMonthMap[row.user_id] = (jobsSavedMonthMap[row.user_id] ?? 0) + 1
      }
    }

    const { data: cvUpdates } = await db
      .from('jobmate_activity')
      .select('user_id')
      .in('user_id', userIds)
      .eq('activity_type', 'cv_upload')
      .gte('created_at', monthStart.toISOString())
    if (cvUpdates) {
      for (const row of cvUpdates) {
        cvUpdatesMonthMap[row.user_id] = (cvUpdatesMonthMap[row.user_id] ?? 0) + 1
      }
    }
  }

  // ── Anwesenheit heute ──────────────────────────────────────────────────
  const todayDate = new Date().toISOString().slice(0, 10)
  const { data: attendanceRows } = await db
    .from('attendance')
    .select('user_id, check_in, check_out, was_late')
    .eq('organization_id', profile.organization_id)
    .eq('date', todayDate)
  const attendanceMap: Record<string, { check_in: string; check_out: string | null; was_late: boolean }> =
    Object.fromEntries((attendanceRows ?? []).map(r => [r.user_id, r]))

  // ── Maßnahmen-Statistik: Bewerbungs-Velocity + Zeit bis 1. Bewerbung ──
  let allApps: { user_id: string; applied_at: string | null; created_at: string }[] = []
  let createdMap: Record<string, number> = {}
  if (userIds.length > 0) {
    const [appsRes, profsRes] = await Promise.all([
      db.from('jobmate_activity').select('user_id, applied_at, created_at').in('user_id', userIds).eq('activity_type', 'application'),
      db.from('profiles').select('id, created_at').in('id', userIds),
    ])
    allApps = appsRes.data ?? []
    createdMap = Object.fromEntries((profsRes.data ?? []).map(r => [r.id, new Date(r.created_at).getTime()]))
  }

  const list = (participants ?? []).map(p => ({
    ...p,
    last_active: p.last_active ?? p.last_linguu_active ?? null,
    assessment_level: assessmentMap[p.id] ?? null,
    jobs_saved_this_month: jobsSavedMonthMap[p.id] ?? 0,
    cv_updates_this_month: cvUpdatesMonthMap[p.id] ?? 0,
  }))
  // Velocity-Kennzahlen aus Eintritt (created_at) + Bewerbungs-Zeitpunkten
  const nowMs = Date.now()
  const WEEK = 7 * 86400000
  const appsByUser: Record<string, { count: number; first: number }> = {}
  for (const a of allApps) {
    const t = new Date(a.applied_at ?? a.created_at).getTime()
    const u = (appsByUser[a.user_id] ??= { count: 0, first: Infinity })
    u.count++; u.first = Math.min(u.first, t)
  }
  let earliestEntry = nowMs
  const perPartWeekly: number[] = []
  const firstAppDays: number[] = []
  for (const uid of userIds) {
    const entry = createdMap[uid] ?? nowMs
    earliestEntry = Math.min(earliestEntry, entry)
    const weeks = Math.max(1, (nowMs - entry) / WEEK)
    const ua = appsByUser[uid]
    perPartWeekly.push((ua?.count ?? 0) / weeks)
    if (ua) firstAppDays.push((ua.first - entry) / 86400000)
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
  const statActive = list.filter(p => p.last_active && nowMs - new Date(p.last_active).getTime() < 14 * 86400000).length
  const statPerPartWeekly = avg(perPartWeekly)
  const statFirstAppDays = avg(firstAppDays)
  const statMeasureWeekly = allApps.length / Math.max(1, (nowMs - earliestEntry) / WEEK)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl">Übersicht</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {list.length} Teilnehmer registriert
          </p>
        </div>
        <Link href="/coordinator/teilnehmer"
          className="btn-primary"
          style={{ background: 'var(--primary)' }}>
          <Plus size={16} />
          Teilnehmer anlegen
        </Link>
      </div>

      {/* Statistiken — Maßnahmen-Overview */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
          Statistiken
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: statActive, sub: 'in der Maßnahme · aktiv (14 Tage)', label: 'Aktive Teilnehmer', icon: Users, color: 'var(--primary)' },
            { value: statPerPartWeekly.toFixed(1), sub: 'pro Teilnehmer / Woche', label: 'Ø Bewerbungen', icon: Briefcase, color: 'var(--warning)' },
            { value: Math.round(statFirstAppDays), sub: 'Ø nach Maßnahmeneintritt', label: 'Tage bis 1. Bewerbung', icon: Clock, color: 'var(--accent)' },
            { value: statMeasureWeekly.toFixed(1), sub: 'Maßnahme gesamt / Woche', label: 'Bewerbungs-Output', icon: TrendingUp, color: 'var(--success)' },
          ].map(({ value, sub, label, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-bold leading-none" style={{ fontFamily: 'Fira Code, monospace', color }}>{value}</p>
              <p className="text-sm mt-1.5 font-medium">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anwesenheit heute */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
          Anwesenheit heute · {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
        </p>
        <div className="card p-0 overflow-hidden">
          {list.length === 0 ? (
            <p className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>Noch keine Teilnehmer angelegt.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {list.map(p => {
                const att = attendanceMap[p.id]
                const checkIn = att?.check_in ? new Date(att.check_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null
                const checkOut = att?.check_out ? new Date(att.check_out).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    {att ? (
                      att.was_late
                        ? <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        : <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    ) : (
                      <Circle size={16} style={{ color: 'var(--border)', flexShrink: 0 }} />
                    )}
                    <span className="flex-1 text-sm font-medium">{p.full_name}</span>
                    {att ? (
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        eingestempelt <strong style={{ color: 'var(--text)', fontFamily: 'Fira Code, monospace' }}>{checkIn}</strong>
                        {checkOut && <> · ausgestempelt <strong style={{ color: 'var(--text)', fontFamily: 'Fira Code, monospace' }}>{checkOut}</strong></>}
                        {' · '}
                        <span style={{ color: att.was_late ? 'var(--warning)' : 'var(--success)' }}>
                          {att.was_late ? 'verspätet' : 'pünktlich'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>noch nicht eingestempelt</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Teilnehmer-Tabelle */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold">Teilnehmer-Aktivität</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Eigeninitiative-Nachweis für das Jobcenter
          </p>
        </div>

        {list.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Noch keine Teilnehmer angelegt.</p>
            <Link href="/coordinator/teilnehmer" className="text-sm font-medium mt-2 inline-block"
              style={{ color: 'var(--primary)' }}>
              Jetzt Teilnehmer anlegen →
            </Link>
          </div>
        ) : (
          <ParticipantTable participants={list} />
        )}
      </div>
    </div>
  )
}
