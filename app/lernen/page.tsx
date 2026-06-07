import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, BookOpen, Briefcase, ArrowRight } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import WelcomeModal from '@/components/lernen/WelcomeModal'

// ── Übersetzungen ──────────────────────────────────────────────

const GREETINGS: Record<NativeLanguage, string> = {
  ar: 'أهلاً', uk: 'Привіт', es: 'Hola', en: 'Hello',
  ku: 'Merheba', tr: 'Merhaba', pl: 'Cześć', ro: 'Salut', ru: 'Привет',
}

const CHOICE: Record<NativeLanguage, {
  q: string; sub: string
  l1: string; l1sub: string
  l2: string; l2sub: string
  l3: string; l3sub: string
}> = {
  ar: { q: 'ماذا تريد أن تفعل؟', sub: 'اختر مسارك اليوم',
    l1: 'التعلم — الحياة في ألمانيا', l1sub: 'عبارات يومية · مفردات · اختبار',
    l2: 'تعلم اللغة مع Linguu', l2sub: 'تدريبات متقدمة في الألمانية',
    l3: 'البحث عن عمل مع JobMate', l3sub: 'سيرة ذاتية وتقديم على وظائف' },
  uk: { q: 'Що ти хочеш зробити?', sub: 'Обери свій шлях сьогодні',
    l1: 'Навчання — Життя в Німеччині', l1sub: 'Фрази · Слова · Тест',
    l2: 'Вчи мову з Linguu', l2sub: 'Просунута практика німецької',
    l3: 'Знайди роботу з JobMate', l3sub: 'Резюме та подача заявок' },
  es: { q: '¿Qué quieres hacer?', sub: 'Elige tu camino hoy',
    l1: 'Aprender — Vivir en Alemania', l1sub: 'Frases · Palabras · Quiz',
    l2: 'Aprende el idioma con Linguu', l2sub: 'Práctica avanzada de alemán',
    l3: 'Busca trabajo con JobMate', l3sub: 'CV y solicitudes de empleo' },
  en: { q: 'What would you like to do?', sub: 'Choose your path today',
    l1: 'Learning — Life in Germany', l1sub: 'Phrases · Vocabulary · Quiz',
    l2: 'Learn the language with Linguu', l2sub: 'Advanced German practice',
    l3: 'Find a job with JobMate', l3sub: 'CV and job applications' },
  ku: { q: 'Tu dixwazî çi bikî?', sub: 'Riya xwe ya îro hilbijêre',
    l1: 'Fêrbûn — Jiyana li Almanyayê', l1sub: 'Hevok · Peyv · Ceribandin',
    l2: 'Zimanî bi Linguu hîn bibe', l2sub: 'Pratîka Almanî ya pêşketî',
    l3: 'Kar bi JobMate bibîne', l3sub: 'CV û serlêdana karî' },
  tr: { q: 'Ne yapmak istiyorsun?', sub: 'Bugün yolunu seç',
    l1: "Öğrenme — Almanya'da Hayat", l1sub: 'İfadeler · Kelimeler · Test',
    l2: "Linguu'yla dil öğren", l2sub: 'Gelişmiş Almanca pratiği',
    l3: "JobMate'le iş bul", l3sub: 'CV ve iş başvuruları' },
  pl: { q: 'Co chcesz zrobić?', sub: 'Wybierz swoją ścieżkę',
    l1: 'Nauka — Życie w Niemczech', l1sub: 'Zwroty · Słówka · Quiz',
    l2: 'Ucz się języka z Linguu', l2sub: 'Zaawansowana praktyka niemieckiego',
    l3: 'Znajdź pracę z JobMate', l3sub: 'CV i aplikacje o pracę' },
  ro: { q: 'Ce vrei să faci?', sub: 'Alege-ţi calea de azi',
    l1: 'Învăţare — Viaţa în Germania', l1sub: 'Expresii · Cuvinte · Test',
    l2: 'Învaţă limba cu Linguu', l2sub: 'Practică avansată de germană',
    l3: 'Găseşte un loc de muncă cu JobMate', l3sub: 'CV şi candidaturi' },
  ru: { q: 'Что ты хочешь делать?', sub: 'Выбери свой путь сегодня',
    l1: 'Обучение — Жизнь в Германии', l1sub: 'Фразы · Слова · Тест',
    l2: 'Учи язык с Linguu', l2sub: 'Продвинутая практика немецкого',
    l3: 'Найди работу с JobMate', l3sub: 'Резюме и заявки на работу' },
}

const DE = {
  q: 'Was möchtest du tun?', sub: 'Wähle deinen Weg für heute',
  l1: 'Lernen — Alltag in Deutschland', l1sub: 'Phrasen · Vokabeln · Quiz',
  l2: 'Sprache lernen mit Linguu', l2sub: 'Fortgeschrittene Deutschübungen',
  l3: 'Arbeit finden mit JobMate', l3sub: 'Lebenslauf & Bewerbungen',
}

export default async function LernenPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, full_name, participant_code')
    .eq('id', user.id)
    .single()

  const lang = (profile?.native_language ?? 'ar') as NativeLanguage
  const C = CHOICE[lang] ?? CHOICE.en
  const isRtl = lang === 'ar' || lang === 'ku'
  const code = profile?.participant_code ?? ''

  const { data: progressRows } = await db
    .from('linguu_progress')
    .select('xp_earned')
    .eq('user_id', user.id)

  const totalXp = progressRows?.reduce((s, r) => s + r.xp_earned, 0) ?? 0
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const PATHS = [
    {
      href: '/lernen/themen',
      icon: GraduationCap,
      color: '#6366f1',
      title: C.l1,
      titleDE: DE.l1,
      sub: C.l1sub,
      subDE: DE.l1sub,
    },
    {
      href: `/lernen/linguu`,
      icon: BookOpen,
      color: '#10b981',
      title: C.l2,
      titleDE: DE.l2,
      sub: C.l2sub,
      subDE: DE.l2sub,
    },
    {
      href: '/lernen/jobs',
      icon: Briefcase,
      color: '#f59e0b',
      title: C.l3,
      titleDE: DE.l3,
      sub: C.l3sub,
      subDE: DE.l3sub,
    },
  ]

  return (
    <div className="space-y-6">
      {profile?.participant_code && (
        <WelcomeModal lang={lang} participantCode={code} isNewUser={totalXp === 0} />
      )}

      {/* Begrüßung */}
      <div>
        <h1 className="text-xl font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
          {GREETINGS[lang]}, {firstName} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Willkommen, {firstName}!
        </p>
        {totalXp > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min((totalXp / 2000) * 100, 100)}%`, background: 'var(--primary)' }} />
            </div>
            <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--primary)', fontFamily: 'Fira Code, monospace' }}>
              {totalXp} XP
            </span>
          </div>
        )}
      </div>

      {/* Was möchtest du tun? */}
      <div>
        <div className="mb-4">
          <p className="text-base font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>{C.q}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{DE.q}</p>
        </div>

        <div className="space-y-3">
          {PATHS.map(({ href, icon: Icon, color, title, titleDE, sub, subDE }) => (
            <Link key={href} href={href}
              className="card flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
              style={{ textDecoration: 'none', borderLeft: `3px solid ${color}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0" dir={isRtl ? 'rtl' : 'ltr'}>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.75 }}>{titleDE}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
                <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.65 }}>{subDE}</p>
              </div>
              <ArrowRight size={16} className="flex-shrink-0" style={{ color: 'var(--muted)' }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
