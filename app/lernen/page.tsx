import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Briefcase, FileText, Landmark, ShieldCheck } from 'lucide-react'
import type { ComponentType, CSSProperties } from 'react'
import type { NativeLanguage } from '@/types'
import WelcomeModal from '@/components/lernen/WelcomeModal'
import GuideSection from '@/components/lernen/GuideSection'

const GREETINGS: Record<NativeLanguage, string> = {
  ar: 'أهلاً', uk: 'Привіт', es: 'Hola', en: 'Hello',
  ku: 'Merheba', tr: 'Merhaba', pl: 'Cześć', ro: 'Salut', ru: 'Привет',
}

function monthStartIso() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string
  value: number | string
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
        <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'Fira Code, monospace' }}>{value}</p>
        <p className="text-sm font-medium mt-1">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
      </div>
    </div>
  )
}

export default async function TeilnehmerHubPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, full_name, participant_code')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const lang = (profile.native_language ?? 'ar') as NativeLanguage
  const isRtl = lang === 'ar' || lang === 'ku'
  const firstName = profile.full_name?.split(' ')[0] ?? ''
  const code = profile.participant_code ?? ''
  const monthStart = monthStartIso()

  const [{ data: progressRows }, { data: jobmateRows }, { data: assessments }] = await Promise.all([
    db.from('linguu_progress')
      .select('lesson_type, score, xp_earned, completed_at')
      .eq('user_id', user.id),
    db.from('jobmate_activity')
      .select('activity_type, created_at')
      .eq('user_id', user.id),
    db.from('assessment_results')
      .select('level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const progress = progressRows ?? []
  const jobmate = jobmateRows ?? []
  const monthlyProgress = progress.filter(row => row.completed_at >= monthStart)
  const monthlyJobmate = jobmate.filter(row => row.created_at >= monthStart)
  const quizScores = progress
    .filter(row => row.lesson_type === 'quiz' && row.score != null)
    .map(row => row.score as number)
  const avgQuiz = quizScores.length
    ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
    : 0
  const totalXp = progress.reduce((sum, row) => sum + (row.xp_earned ?? 0), 0)
  const latestLevel = assessments?.[0]?.level ?? 'offen'
  const cvUpdates = monthlyJobmate.filter(row => row.activity_type === 'cv_upload').length
  const jobsSaved = monthlyJobmate.filter(row => row.activity_type === 'job_saved').length
  const applications = monthlyJobmate.filter(row => row.activity_type === 'application').length

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
      title: 'Einbürgerung & Orientierung',
      sub: '460 BAMF-Fragen · echter Testmodus mit Bundesland-Auswahl',
      icon: Landmark,
      color: '#6366f1',
      external: false,
    },
  ]

  return (
    <div className="space-y-6">
      {code && <WelcomeModal lang={lang} participantCode={code} isNewUser={progress.length === 0 && jobmate.length === 0} />}

      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(245,158,11,0.10))', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--primary)' }}>
            W
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
              {GREETINGS[lang] ?? GREETINGS.en}, {firstName} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Das ist deine WID-Schaltzentrale. Hier siehst du deinen Fortschritt aus Linguu und JobMate.
            </p>
            {code && (
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--muted)' }}>WID-Code</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{code}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} color="#6366f1" value={monthlyProgress.length} label="Linguu-Lektionen" sub="diesen Monat" />
        <StatCard icon={FileText} color="#10b981" value={cvUpdates} label="CV bearbeitet" sub="via JobMate" />
        <StatCard icon={Briefcase} color="#f59e0b" value={jobsSaved} label="Jobs interessant" sub="diesen Monat" />
        <StatCard icon={BarChart3} color="#ef4444" value={applications} label="Bewerbungen" sub="dokumentiert" />
      </div>

      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
          Dein aktueller Nachweis
        </p>
        <p className="text-sm leading-relaxed">
          Du hast insgesamt <strong>{progress.length}</strong> Linguu-Aktivitäten mit <strong>{totalXp} XP</strong> abgeschlossen,
          dein aktuelles Sprachniveau ist <strong>{latestLevel}</strong>
          {avgQuiz > 0 ? <> und dein Quiz-Durchschnitt liegt bei <strong>{avgQuiz}%</strong></> : null}.
          In JobMate wurden diesen Monat <strong>{jobsSaved}</strong> interessante Jobs und <strong>{applications}</strong> Bewerbungen dokumentiert.
        </p>
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
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
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
