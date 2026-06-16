'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BarChart3, BookOpen, Briefcase, FileText, Landmark, ShieldCheck } from 'lucide-react'
import type { ComponentType, CSSProperties } from 'react'
import type { NativeLanguage } from '@/types'
import { useParticipant } from '@/components/lernen/ParticipantProvider'
import WelcomeModal from '@/components/lernen/WelcomeModal'
import AttendanceClock from '@/components/lernen/AttendanceClock'
import GuideSection from '@/components/lernen/GuideSection'
import { LinguuTab } from '@/components/lernen/tabs/LinguuTab'
import { JobsTab } from '@/components/lernen/tabs/JobsTab'

const GREETINGS: Record<NativeLanguage, string> = {
  ar: 'أهلاً', uk: 'Привіт', es: 'Hola', en: 'Hello',
  ku: 'Merheba', tr: 'Merhaba', pl: 'Cześć', ro: 'Salut', ru: 'Привет', de: 'Hallo',
}

interface Stats {
  monthlyLinguu: number
  cvUpdates: number
  jobsSaved: number
  applications: number
  totalProgress: number
  totalJobmate: number
  totalXp: number
  latestLevel: string
  avgQuiz: number
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string
  value: number | null
  sub: string
  color: string
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        {value === null ? (
          <div
            className="rounded animate-pulse"
            style={{ width: 32, height: 24, background: 'var(--surface-2)' }}
          />
        ) : (
          <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'Fira Code, monospace' }}>{value}</p>
        )}
        <p className="text-sm font-medium mt-1">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

// Linguu- und Jobs-Tabs landen auf /lernen?tab=linguu / ?tab=jobs — rein clientseitig,
// kein Server-Roundtrip. Der Router wechselt nur die Search-Params, nicht die Route.
export default function TeilnehmerHubPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  if (tab === 'linguu') return <LinguuTab />
  if (tab === 'jobs') return <JobsTab />

  return <HubContent />
}

function HubContent() {
  const { fullName, nativeLang, participantCode } = useParticipant()
  const [stats, setStats] = useState<Stats | null>(null)

  const lang = nativeLang
  const isRtl = lang === 'ar' || lang === 'ku'
  const firstName = fullName.split(' ')[0] ?? ''
  const code = participantCode

  useEffect(() => {
    let active = true
    fetch('/api/participant/stats')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (active && data) setStats(data) })
      .catch(() => { /* Stats bleiben im Lade-/Leerzustand — Shell funktioniert trotzdem */ })
    return () => { active = false }
  }, [])

  const actions = [
    {
      href: `https://linguu.techstag.de?wid=${code}`,
      title: 'Linguu öffnen',
      sub: 'Deutsch lernen, Assessment machen, Fortschritt synchronisieren',
      icon: BookOpen,
      color: '#10b981',
      external: true,
    },
    {
      href: `https://jobmate.techstag.de?wid=${code}`,
      title: 'JobMate öffnen',
      sub: 'Lebenslauf verbessern, Jobs speichern, Bewerbungen dokumentieren',
      icon: Briefcase,
      color: '#f59e0b',
      external: true,
    },
    {
      href: '/lernen/einbuergerung',
      title: 'Orientierung öffnen',
      sub: 'Orientierung, Einbürgerung und relevante Inhalte für Geflüchtete',
      icon: Landmark,
      color: '#6366f1',
      external: false,
    },
  ]

  return (
    <div className="space-y-6">
      {code && stats && (
        <WelcomeModal
          lang={lang}
          participantCode={code}
          isNewUser={stats.totalProgress === 0 && stats.totalJobmate === 0}
        />
      )}

      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(245,158,11,0.10))', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--primary)' }}>
            E
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-xl font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
              {GREETINGS[lang] ?? GREETINGS.en}, {firstName} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Das ist deine Enter-Schaltzentrale. Hier siehst du deinen Fortschritt aus Linguu, JobMate und Orientierung.
            </p>
            {code && (
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--muted)' }}>Enter-Code</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{code}</span>
              </div>
            )}
          </div>
          <AttendanceClock />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} color="#6366f1" value={stats?.monthlyLinguu ?? null} label="Linguu-Lektionen" sub="diesen Monat" />
        <StatCard icon={FileText} color="#10b981" value={stats?.cvUpdates ?? null} label="CV bearbeitet" sub="via JobMate" />
        <StatCard icon={Briefcase} color="#f59e0b" value={stats?.jobsSaved ?? null} label="Jobs interessant" sub="diesen Monat" />
        <StatCard icon={BarChart3} color="#ef4444" value={stats?.applications ?? null} label="Bewerbungen" sub="dokumentiert" />
      </div>

      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
          Dein aktueller Nachweis
        </p>
        {stats ? (
          <p className="text-sm leading-relaxed">
            Du hast insgesamt <strong>{stats.totalProgress}</strong> Linguu-Aktivitäten mit <strong>{stats.totalXp} XP</strong> abgeschlossen,
            dein aktuelles Sprachniveau ist <strong>{stats.latestLevel}</strong>
            {stats.avgQuiz > 0 ? <> und dein Quiz-Durchschnitt liegt bei <strong>{stats.avgQuiz}%</strong></> : null}.
            In JobMate wurden diesen Monat <strong>{stats.jobsSaved}</strong> interessante Jobs und <strong>{stats.applications}</strong> Bewerbungen dokumentiert.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="rounded animate-pulse" style={{ height: 14, width: '100%', background: 'var(--surface-2)' }} />
            <div className="rounded animate-pulse" style={{ height: 14, width: '80%', background: 'var(--surface-2)' }} />
          </div>
        )}
      </div>

      {code && <GuideSection lang={lang} participantCode={code} />}

      <div className="space-y-3">
        <p className="text-base font-semibold">Was möchtest du als Nächstes tun?</p>
        {actions.map(({ href, title, sub, icon: Icon, color, external }) => {
          const inner = (
            <>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--muted)' }} />
            </>
          )
          return external ? (
            <a key={href} href={href}
              className="card flex items-center gap-4 transition-all hover:shadow-md"
              style={{ textDecoration: 'none', borderLeft: `4px solid ${color}` }}>
              {inner}
            </a>
          ) : (
            <Link key={href} href={href}
              className="card flex items-center gap-4 transition-all hover:shadow-md"
              style={{ textDecoration: 'none', borderLeft: `4px solid ${color}` }}>
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
