'use client'

import { ExternalLink, BookOpen } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { CopyButton } from '@/components/lernen/CopyButton'
import { useParticipant } from '@/components/lernen/ParticipantProvider'

const LABELS: Record<NativeLanguage, {
  title: string; sub: string; codeLabel: string
  openLabel: string; hint: string
}> = {
  ar: { title: 'تعلم الألمانية مع Linguu', sub: 'أدخل كود Enter الخاص بك في Linguu لمزامنة تقدمك', codeLabel: 'كود Enter الخاص بك', openLabel: 'فتح Linguu', hint: 'سيتم إدخال كودك تلقائيًا' },
  uk: { title: 'Вчи німецьку з Linguu', sub: 'Введи свій Enter-код у Linguu для синхронізації прогресу', codeLabel: 'Твій Enter-код', openLabel: 'Відкрити Linguu', hint: 'Твій код буде введено автоматично' },
  es: { title: 'Aprende alemán con Linguu', sub: 'Introduce tu código Enter en Linguu para sincronizar tu progreso', codeLabel: 'Tu código Enter', openLabel: 'Abrir Linguu', hint: 'Tu código se introducirá automáticamente' },
  en: { title: 'Learn German with Linguu', sub: 'Enter your Enter code in Linguu to sync your progress', codeLabel: 'Your Enter code', openLabel: 'Open Linguu', hint: 'Your code will be entered automatically' },
  ku: { title: 'Almanî bi Linguu hîn bibe', sub: 'Koda Enter xwe di Linguu de binivîse da pêşkeftina xwe hevdeng bike', codeLabel: 'Koda Enter ya te', openLabel: 'Linguu veke', hint: 'Koda te dê bixweber were kirin' },
  tr: { title: "Linguu'yla Almanca öğren", sub: "İlerlemenizi senkronize etmek için Linguu'ya Enter kodunu gir", codeLabel: 'Enter kodun', openLabel: "Linguu'yu Aç", hint: 'Kodun otomatik olarak girilecek' },
  pl: { title: 'Ucz się niemieckiego z Linguu', sub: 'Wpisz swój kod Enter w Linguu, aby zsynchronizować postępy', codeLabel: 'Twój kod Enter', openLabel: 'Otwórz Linguu', hint: 'Twój kod zostanie wprowadzony automatycznie' },
  ro: { title: 'Învaţă germana cu Linguu', sub: 'Introdu codul Enter în Linguu pentru a-ţi sincroniza progresul', codeLabel: 'Codul tău Enter', openLabel: 'Deschide Linguu', hint: 'Codul tău va fi introdus automat' },
  ru: { title: 'Учи немецкий с Linguu', sub: 'Введи свой Enter-код в Linguu для синхронизации прогресса', codeLabel: 'Твой Enter-код', openLabel: 'Открыть Linguu', hint: 'Твой код будет введён автоматически' },
  de: { title: 'Deutsch lernen mit Linguu', sub: 'Gib deinen Enter-Code in Linguu ein, um deinen Fortschritt zu synchronisieren', codeLabel: 'Dein Enter-Code', openLabel: 'Linguu öffnen', hint: 'Dein Code wird automatisch eingetragen' },
}

const DE = {
  title: 'Deutsch lernen mit Linguu',
  sub: 'Gib deinen Enter-Code in Linguu ein, um deinen Fortschritt zu synchronisieren',
  codeLabel: 'Dein Enter-Code',
  openLabel: 'Linguu öffnen',
  hint: 'Dein Code wird automatisch eingetragen',
}

export function LinguuTab() {
  const { nativeLang, participantCode } = useParticipant()

  const lang = nativeLang
  const L = LABELS[lang] ?? LABELS.en
  const isRtl = lang === 'ar' || lang === 'ku'
  const code = participantCode
  const linguuUrl = `https://linguu.techstag.de/?wid=${encodeURIComponent(code)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold leading-none" dir={isRtl ? 'rtl' : 'ltr'}>{L.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{DE.title}</p>
      </div>

      <p className="text-sm" style={{ color: 'var(--muted)' }} dir={isRtl ? 'rtl' : 'ltr'}>{L.sub}</p>
      {L.sub !== DE.sub && (
        <p className="text-xs -mt-4" style={{ color: 'var(--muted)', opacity: 0.7 }}>{DE.sub}</p>
      )}

      <div className="card" style={{ borderColor: '#10b981', borderWidth: 2 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#10b981' }} dir={isRtl ? 'rtl' : 'ltr'}>
          {L.codeLabel}
        </p>
        {L.codeLabel !== DE.codeLabel && (
          <p className="text-xs mb-2" style={{ color: '#10b981', opacity: 0.7 }}>{DE.codeLabel}</p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-widest flex-1"
            style={{ fontFamily: 'Fira Code, monospace', color: '#10b981' }}>
            {code}
          </span>
          <CopyButton text={code} />
        </div>
      </div>

      <a href={linguuUrl}
        className="card flex items-center gap-4 transition-all hover:shadow-md cursor-pointer"
        style={{ textDecoration: 'none', borderColor: '#10b981', borderWidth: 2 }}>
        <div className="p-3 rounded-xl flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <BookOpen size={24} style={{ color: '#10b981' }} />
        </div>
        <div className="flex-1" dir={isRtl ? 'rtl' : 'ltr'}>
          <p className="font-semibold" style={{ color: '#10b981' }}>{L.openLabel}</p>
          <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{DE.openLabel}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{L.hint}</p>
          {L.hint !== DE.hint && (
            <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{DE.hint}</p>
          )}
        </div>
        <ExternalLink size={18} style={{ color: '#10b981' }} />
      </a>

      <p className="text-xs text-center" style={{ color: 'var(--muted)', opacity: 0.6 }}>
        linguu.techstag.de
      </p>
    </div>
  )
}
