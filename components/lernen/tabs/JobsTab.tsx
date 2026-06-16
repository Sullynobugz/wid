'use client'

import { ExternalLink, Briefcase } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { CopyButton } from '@/components/lernen/CopyButton'
import { useParticipant } from '@/components/lernen/ParticipantProvider'

const LABELS: Record<NativeLanguage, {
  title: string; sub: string; codeLabel: string; copyHint: string
  openLabel: string; step1: string; step2: string; step3: string
}> = {
  ar: { title: 'استكشف فرص العمل', sub: 'استخدم كود Enter الخاص بك في JobMate', codeLabel: 'كود Enter الخاص بك', copyHint: 'انسخ الكود ثم أدخله في JobMate', openLabel: 'فتح JobMate', step1: '1. انسخ كودك أدناه', step2: '2. افتح JobMate', step3: '3. أدخل الكود عند المطالبة' },
  uk: { title: 'Знайди роботу', sub: 'Використовуй свій Enter-код у JobMate', codeLabel: 'Твій Enter-код', copyHint: 'Скопіюй код і введи його в JobMate', openLabel: 'Відкрити JobMate', step1: '1. Скопіюй свій код нижче', step2: '2. Відкрий JobMate', step3: '3. Введи код коли попросять' },
  es: { title: 'Busca trabajo', sub: 'Usa tu código Enter en JobMate', codeLabel: 'Tu código Enter', copyHint: 'Copia el código e introdúcelo en JobMate', openLabel: 'Abrir JobMate', step1: '1. Copia tu código abajo', step2: '2. Abre JobMate', step3: '3. Introduce el código cuando te lo pidan' },
  en: { title: 'Find a job', sub: 'Use your Enter code in JobMate', codeLabel: 'Your Enter code', copyHint: 'Copy the code and enter it in JobMate', openLabel: 'Open JobMate', step1: '1. Copy your code below', step2: '2. Open JobMate', step3: '3. Enter the code when prompted' },
  ku: { title: 'Kar bibîne', sub: 'Koda Enter xwe di JobMate de bikar bîne', codeLabel: 'Koda Enter ya te', copyHint: 'Koda xwe kopî bike û di JobMate de binivîse', openLabel: 'JobMate veke', step1: '1. Koda xwe li jêr kopî bike', step2: '2. JobMate veke', step3: '3. Dema hatî xwestin koda xwe binivîse' },
  tr: { title: 'İş bul', sub: 'JobMate\'de Enter kodunu kullan', codeLabel: 'Enter kodun', copyHint: 'Kodu kopyala ve JobMate\'e gir', openLabel: 'JobMate\'i Aç', step1: '1. Aşağıdaki kodunu kopyala', step2: '2. JobMate\'i aç', step3: '3. İstendiğinde kodu gir' },
  pl: { title: 'Znajdź pracę', sub: 'Użyj swojego kodu Enter w JobMate', codeLabel: 'Twój kod Enter', copyHint: 'Skopiuj kod i wprowadź go w JobMate', openLabel: 'Otwórz JobMate', step1: '1. Skopiuj swój kod poniżej', step2: '2. Otwórz JobMate', step3: '3. Wprowadź kod gdy zostaniesz poproszony' },
  ro: { title: 'Găsește un loc de muncă', sub: 'Folosește codul tău Enter în JobMate', codeLabel: 'Codul tău Enter', copyHint: 'Copiază codul și introdu-l în JobMate', openLabel: 'Deschide JobMate', step1: '1. Copiază codul tău de mai jos', step2: '2. Deschide JobMate', step3: '3. Introdu codul când ți se cere' },
  ru: { title: 'Найди работу', sub: 'Используй свой Enter-код в JobMate', codeLabel: 'Твой Enter-код', copyHint: 'Скопируй код и введи его в JobMate', openLabel: 'Открыть JobMate', step1: '1. Скопируй свой код ниже', step2: '2. Открой JobMate', step3: '3. Введи код когда попросят' },
  de: { title: 'Arbeit finden', sub: 'Nutze deinen Enter-Code in JobMate', codeLabel: 'Dein Enter-Code', copyHint: 'Code kopieren und in JobMate eingeben', openLabel: 'JobMate öffnen', step1: '1. Kopiere deinen Code unten', step2: '2. Öffne JobMate', step3: '3. Gib den Code ein, wenn du gefragt wirst' },
}

const DE = { title: 'Arbeit finden', sub: 'Nutze deinen Enter-Code in JobMate', codeLabel: 'Dein Enter-Code', copyHint: 'Code kopieren und in JobMate eingeben', openLabel: 'JobMate öffnen' }

export function JobsTab() {
  const { nativeLang, participantCode } = useParticipant()

  const lang = nativeLang
  const L = LABELS[lang] ?? LABELS.en
  const code = participantCode
  const jobmateUrl = `https://jobmate.techstag.de/?wid=${encodeURIComponent(code)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{L.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{L.sub}</p>
      </div>

      <div className="card" style={{ borderColor: 'var(--primary)', borderWidth: 2 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
          {L.codeLabel}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tracking-widest flex-1" style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
            {code}
          </span>
          <CopyButton text={code} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{L.copyHint}</span>
        </div>
      </div>

      <div className="card space-y-4">
        {[L.step1, L.step2, L.step3].map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: 'var(--primary)' }}>{i + 1}</div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>

      <a href={jobmateUrl}
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
