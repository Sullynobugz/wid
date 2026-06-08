import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, Briefcase, TrendingUp, Plus } from 'lucide-react'
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

  const list = (participants ?? []).map(p => ({
    ...p,
    last_active: p.last_active ?? p.last_linguu_active ?? null,
    assessment_level: assessmentMap[p.id] ?? null,
    jobs_saved_this_month: jobsSavedMonthMap[p.id] ?? 0,
    cv_updates_this_month: cvUpdatesMonthMap[p.id] ?? 0,
  }))
  const activeCount = list.filter(p => p.last_active).length
  const totalLessons = list.reduce((s, p) => s + p.lessons_completed, 0)
  const totalApplications = list.reduce((s, p) => s + (p.total_applications ?? 0), 0)
  const applicationsThisWeek = list.reduce((s, p) => s + (p.applications_this_week ?? 0), 0)

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

      {/* KPI-Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Teilnehmer', value: list.length, icon: Users, color: 'var(--primary)' },
          { label: 'Aktiv diese Woche', value: activeCount, icon: TrendingUp, color: 'var(--success)' },
          { label: 'Lektionen gesamt', value: totalLessons, icon: BookOpen, color: 'var(--accent)' },
          { label: 'Bewerbungen (Woche)', value: applicationsThisWeek, icon: Briefcase, color: 'var(--warning)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-start gap-3">
            <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'Fira Code, monospace' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
          </div>
        ))}
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
