import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ExternalLink, Briefcase } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { CopyButton } from '@/components/lernen/CopyButton'

const LABELS: Record<NativeLanguage, {
  title: string; sub: string; codeLabel: string; copyHint: string
  openLabel: string; step1: string; step2: string; step3: string
}> = {
  ar: { title: 'استكشف فرص العمل', sub: 'استخدم كود WID الخاص بك في JobMate', codeLabel: 'كود WID الخاص بك', copyHint: 'انسخ الكود ثم أدخله في JobMate', openLabel: 'فتح JobMate', step1: '1. انسخ كودك أدناه', step2: '2. افتح JobMate', step3: '3. أدخل الكود عند المطالبة' },
  uk: { title: 'Знайди роботу', sub: 'Використовуй свій WID-код у JobMate', codeLabel: 'Твій WID-код', copyHint: 'Скопіюй код і введи його в JobMate', openLabel: 'Відкрити JobMate', step1: '1. Скопіюй свій код нижче', step2: '2. Відкрий JobMate', step3: '3. Введи код коли попросять' },
  es: { title: 'Busca trabajo', sub: 'Usa tu código WID en JobMate', codeLabel: 'Tu código WID', copyHint: 'Copia el código e introdúcelo en JobMate', openLabel: 'Abrir JobMate', step1: '1. Copia tu código abajo', step2: '2. Abre JobMate', step3: '3. Introduce el código cuando te lo pidan' },
  en: { title: 'Find a job', sub: 'Use your WID code in JobMate', codeLabel: 'Your WID code', copyHint: 'Copy the code and enter it in JobMate', openLabel: 'Open JobMate', step1: '1. Copy your code below', step2: '2. Open JobMate', step3: '3. Enter the code when prompted' },
  ku: { title: 'Kar bibîne', sub: 'Koda WID xwe di JobMate de bikar bîne', codeLabel: 'Koda WID ya te', copyHint: 'Koda xwe kopî bike û di JobMate de binivîse', openLabel: 'JobMate veke', step1: '1. Koda xwe li jêr kopî bike', step2: '2. JobMate veke', step3: '3. Dema hatî xwestin koda xwe binivîse' },
  tr: { title: 'İş bul', sub: 'JobMate\'de WID kodunu kullan', codeLabel: 'WID kodun', copyHint: 'Kodu kopyala ve JobMate\'e gir', openLabel: 'JobMate\'i Aç', step1: '1. Aşağıdaki kodunu kopyala', step2: '2. JobMate\'i aç', step3: '3. İstendiğinde kodu gir' },
  pl: { title: 'Znajdź pracę', sub: 'Użyj swojego kodu WID w JobMate', codeLabel: 'Twój kod WID', copyHint: 'Skopiuj kod i wprowadź go w JobMate', openLabel: 'Otwórz JobMate', step1: '1. Skopiuj swój kod poniżej', step2: '2. Otwórz JobMate', step3: '3. Wprowadź kod gdy zostaniesz poproszony' },
  ro: { title: 'Găsește un loc de muncă', sub: 'Folosește codul tău WID în JobMate', codeLabel: 'Codul tău WID', copyHint: 'Copiază codul și introdu-l în JobMate', openLabel: 'Deschide JobMate', step1: '1. Copiază codul tău de mai jos', step2: '2. Deschide JobMate', step3: '3. Introdu codul când ți se cere' },
  ru: { title: 'Найди работу', sub: 'Используй свой WID-код в JobMate', codeLabel: 'Твой WID-код', copyHint: 'Скопируй код и введи его в JobMate', openLabel: 'Открыть JobMate', step1: '1. Скопируй свой код ниже', step2: '2. Открой JobMate', step3: '3. Введи код когда попросят' },
}

export default async function JobsPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, participant_code, full_name')
    .eq('id', user.id)
    .single()

  const lang = (profile?.native_language ?? 'en') as NativeLanguage
  const L = LABELS[lang] ?? LABELS.en
  const code = profile?.participant_code ?? ''
  const jobmateUrl = `https://jobmate.techstag.de/?wid=${encodeURIComponent(code)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{L.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{L.sub}</p>
      </div>

      {/* WID-Code prominent */}
      <div className="card" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
          {L.codeLabel}
        </p>
        <CodeDisplay code={code} copyHint={L.copyHint} />
      </div>

      {/* 3-Step Anleitung */}
      <div className="card space-y-4">
        {[L.step1, L.step2, L.step3].map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: 'var(--primary)' }}>{i + 1}</div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>

      {/* JobMate CTA */}
      <a href={jobmateUrl} target="_blank" rel="noopener noreferrer"
        className="card flex items-center gap-4 transition-all hover:shadow-md"
        style={{ textDecoration: 'none', borderColor: 'var(--primary)' }}>
        <div className="p-3 rounded-xl flex-shrink-0" style={{ background: 'rgba(37,99,235,0.1)' }}>
          <Briefcase size={24} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{L.openLabel}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>jobmate.techstag.de</p>
        </div>
        <ExternalLink size={18} style={{ color: 'var(--muted)' }} />
      </a>
    </div>
  )
}

function CodeDisplay({ code, copyHint }: { code: string; copyHint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-bold tracking-widest flex-1" style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
        {code}
      </span>
      <CopyButton text={code} />
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{copyHint}</span>
    </div>
  )
}
