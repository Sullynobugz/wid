import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, Briefcase, TrendingUp, Plus } from 'lucide-react'
import type { ParticipantWithStats } from '@/types'

function formatDate(iso: string | null) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function XpBar({ xp }: { xp: number }) {
  const max = 1000
  const pct = Math.min((xp / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
      </div>
      <span className="text-xs font-medium w-14 text-right" style={{ color: 'var(--text)' }}>{xp} XP</span>
    </div>
  )
}

export default async function CoordinatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: participants } = await supabase
    .from('participant_stats')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('last_active', { ascending: false, nullsFirst: false }) as { data: ParticipantWithStats[] | null }

  const list = participants ?? []
  const activeCount = list.filter(p => p.last_active).length
  const totalLessons = list.reduce((s, p) => s + p.lessons_completed, 0)
  const totalJobs = list.reduce((s, p) => s + p.jobs_saved, 0)

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
          { label: 'Jobs gemerkt', value: totalJobs, icon: Briefcase, color: 'var(--warning)' },
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)` }}>
                  {['Name', 'Code', 'Fortschritt', 'Lektionen', 'Jobs', 'Zuletzt aktiv'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium" style={{ color: 'var(--muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: i < list.length - 1 ? `1px solid var(--border)` : 'none' }}>
                    <td className="px-6 py-4 font-medium">{p.full_name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                        {p.participant_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-36">
                      <XpBar xp={p.total_xp} />
                    </td>
                    <td className="px-6 py-4 text-center">{p.lessons_completed}</td>
                    <td className="px-6 py-4 text-center">{p.jobs_saved}</td>
                    <td className="px-6 py-4" style={{ color: p.last_active ? 'var(--success)' : 'var(--muted)' }}>
                      {formatDate(p.last_active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
