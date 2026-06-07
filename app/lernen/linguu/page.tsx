import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ExternalLink, BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { NativeLanguage } from '@/types'
import { CopyButton } from '@/components/lernen/CopyButton'

const LABELS: Record<NativeLanguage, {
  title: string; sub: string; codeLabel: string
  openLabel: string; hint: string
}> = {
  ar: { title: 'تعلم الألمانية مع Linguu', sub: 'أدخل كود WID الخاص بك في Linguu لمزامنة تقدمك', codeLabel: 'كود WID الخاص بك', openLabel: 'فتح Linguu', hint: 'سيتم إدخال كودك تلقائيًا' },
  uk: { title: 'Вчи німецьку з Linguu', sub: 'Введи свій WID-код у Linguu для синхронізації прогресу', codeLabel: 'Твій WID-код', openLabel: 'Відкрити Linguu', hint: 'Твій код буде введено автоматично' },
  es: { title: 'Aprende alemán con Linguu', sub: 'Introduce tu código WID en Linguu para sincronizar tu progreso', codeLabel: 'Tu código WID', openLabel: 'Abrir Linguu', hint: 'Tu código se introducirá automáticamente' },
  en: { title: 'Learn German with Linguu', sub: 'Enter your WID code in Linguu to sync your progress', codeLabel: 'Your WID code', openLabel: 'Open Linguu', hint: 'Your code will be entered automatically' },
  ku: { title: 'Almanî bi Linguu hîn bibe', sub: 'Koda WID xwe di Linguu de binivîse da pêşkeftina xwe hevdeng bike', codeLabel: 'Koda WID ya te', openLabel: 'Linguu veke', hint: 'Koda te dê bixweber were kirin' },
  tr: { title: "Linguu'yla Almanca öğren", sub: "İlerlemenizi senkronize etmek için Linguu'ya WID kodunu gir", codeLabel: 'WID kodun', openLabel: "Linguu'yu Aç", hint: 'Kodun otomatik olarak girilecek' },
  pl: { title: 'Ucz się niemieckiego z Linguu', sub: 'Wpisz swój kod WID w Linguu, aby zsynchronizować postępy', codeLabel: 'Twój kod WID', openLabel: 'Otwórz Linguu', hint: 'Twój kod zostanie wprowadzony automatycznie' },
  ro: { title: 'Învaţă germana cu Linguu', sub: 'Introdu codul WID în Linguu pentru a-ţi sincroniza progresul', codeLabel: 'Codul tău WID', openLabel: 'Deschide Linguu', hint: 'Codul tău va fi introdus automat' },
  ru: { title: 'Учи немецкий с Linguu', sub: 'Введи свой WID-код в Linguu для синхронизации прогресса', codeLabel: 'Твой WID-код', openLabel: 'Открыть Linguu', hint: 'Твой код будет введён автоматически' },
}

const DE = {
  title: 'Deutsch lernen mit Linguu',
  sub: 'Gib deinen WID-Code in Linguu ein, um deinen Fortschritt zu synchronisieren',
  codeLabel: 'Dein WID-Code',
  openLabel: 'Linguu öffnen',
  hint: 'Dein Code wird automatisch eingetragen',
}

export default async function LinguuPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, participant_code')
    .eq('id', user.id)
    .single()

  const lang = (profile?.native_language ?? 'en') as NativeLanguage
  const L = LABELS[lang] ?? LABELS.en
  const isRtl = lang === 'ar' || lang === 'ku'
  const code = profile?.participant_code ?? ''

  const linguuUrl = `https://linguu.techstag.de/?wid=${encodeURIComponent(code)}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lernen" className="p-2 rounded-lg" style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-none" dir={isRtl ? 'rtl' : 'ltr'}>{L.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{DE.title}</p>
        </div>
      </div>

      <p className="text-sm" style={{ color: 'var(--muted)' }} dir={isRtl ? 'rtl' : 'ltr'}>{L.sub}</p>
      {L.sub !== DE.sub && (
        <p className="text-xs -mt-4" style={{ color: 'var(--muted)', opacity: 0.7 }}>{DE.sub}</p>
      )}

      {/* WID-Code prominent */}
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

      {/* Linguu CTA — übergibt Code direkt per URL */}
      <a href={linguuUrl} target="_blank" rel="noopener noreferrer"
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
