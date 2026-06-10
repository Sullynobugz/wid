'use client'

import { useState } from 'react'
import { LayoutDashboard, BookOpen, Briefcase, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { NativeLanguage } from '@/types'

const T: Record<NativeLanguage, {
  heading: string
  step1Title: string; step1Body: string
  step2Title: string; step2Body: string; step2Code: string
  step3Title: string; step3Body: string
}> = {
  ar: {
    heading: 'كيف تستخدم WID و Linguu و JobMate؟',
    step1Title: 'WID — مركزك', step1Body: 'أنت هنا. WID يتتبع تقدمك تلقائياً.',
    step2Title: 'Linguu — تعلم الألمانية', step2Body: 'افتح linguu.techstag.de وأدخل كود WID الخاص بك للمزامنة.', step2Code: 'كود WID الخاص بك',
    step3Title: 'JobMate — ابحث عن عمل', step3Body: 'افتح jobmate.techstag.de وحسّن سيرتك الذاتية بمساعدة الذكاء الاصطناعي.',
  },
  uk: {
    heading: 'Як користуватися WID, Linguu і JobMate?',
    step1Title: 'WID — твій центр', step1Body: 'Ти тут. WID автоматично відстежує твій прогрес.',
    step2Title: 'Linguu — вчи німецьку', step2Body: 'Відкрий linguu.techstag.de і введи свій WID-код для синхронізації.', step2Code: 'Твій WID-код',
    step3Title: 'JobMate — знайди роботу', step3Body: 'Відкрий jobmate.techstag.de і покращ резюме з допомогою ШІ.',
  },
  es: {
    heading: '¿Cómo usar WID, Linguu y JobMate?',
    step1Title: 'WID — tu centro', step1Body: 'Estás aquí. WID registra tu progreso automáticamente.',
    step2Title: 'Linguu — aprende alemán', step2Body: 'Abre linguu.techstag.de e introduce tu código WID para sincronizar.', step2Code: 'Tu código WID',
    step3Title: 'JobMate — encuentra trabajo', step3Body: 'Abre jobmate.techstag.de y mejora tu CV con ayuda de IA.',
  },
  en: {
    heading: 'How to use WID, Linguu & JobMate?',
    step1Title: 'WID — your hub', step1Body: "You're here. WID automatically tracks your progress.",
    step2Title: 'Linguu — learn German', step2Body: 'Open linguu.techstag.de and enter your WID code to sync.', step2Code: 'Your WID code',
    step3Title: 'JobMate — find a job', step3Body: 'Open jobmate.techstag.de and improve your CV with AI.',
  },
  ku: {
    heading: 'Çawa WID, Linguu û JobMate bikar bîne?',
    step1Title: 'WID — navenda te', step1Body: 'Tu li vir î. WID pêşkeftina te bixweber bişopîne.',
    step2Title: 'Linguu — Almanî hîn bibe', step2Body: 'linguu.techstag.de veke û koda WID ya xwe binivîse.', step2Code: 'Koda WID ya te',
    step3Title: 'JobMate — kar bibîne', step3Body: 'jobmate.techstag.de veke û CV-ya xwe bi alîkariya ZH baştir bike.',
  },
  tr: {
    heading: 'WID, Linguu ve JobMate nasıl kullanılır?',
    step1Title: 'WID — merkezin', step1Body: 'Buradasın. WID ilerlemenizi otomatik olarak takip eder.',
    step2Title: 'Linguu — Almanca öğren', step2Body: 'linguu.techstag.de\'yi aç ve senkronizasyon için WID kodunu gir.', step2Code: 'WID kodun',
    step3Title: 'JobMate — iş bul', step3Body: 'jobmate.techstag.de\'yi aç ve yapay zekayla CV\'ni geliştir.',
  },
  pl: {
    heading: 'Jak korzystać z WID, Linguu i JobMate?',
    step1Title: 'WID — Twoje centrum', step1Body: 'Jesteś tutaj. WID automatycznie śledzi Twoje postępy.',
    step2Title: 'Linguu — ucz się niemieckiego', step2Body: 'Otwórz linguu.techstag.de i wpisz swój kod WID do synchronizacji.', step2Code: 'Twój kod WID',
    step3Title: 'JobMate — znajdź pracę', step3Body: 'Otwórz jobmate.techstag.de i ulepsz CV z pomocą AI.',
  },
  ro: {
    heading: 'Cum să folosești WID, Linguu și JobMate?',
    step1Title: 'WID — centrul tău', step1Body: 'Ești aici. WID îți urmărește automat progresul.',
    step2Title: 'Linguu — învață germana', step2Body: 'Deschide linguu.techstag.de și introdu codul WID pentru sincronizare.', step2Code: 'Codul tău WID',
    step3Title: 'JobMate — găsește un loc de muncă', step3Body: 'Deschide jobmate.techstag.de și îmbunătățește CV-ul cu AI.',
  },
  ru: {
    heading: 'Как пользоваться WID, Linguu и JobMate?',
    step1Title: 'WID — твой центр', step1Body: 'Ты здесь. WID автоматически отслеживает твой прогресс.',
    step2Title: 'Linguu — учи немецкий', step2Body: 'Открой linguu.techstag.de и введи свой WID-код для синхронизации.', step2Code: 'Твой WID-код',
    step3Title: 'JobMate — найди работу', step3Body: 'Открой jobmate.techstag.de и улучши резюме с помощью ИИ.',
  },
}

const DE = {
  heading: 'So nutzt du WID, Linguu & JobMate',
  step1Title: 'WID — dein Zentrum', step1Body: 'Du bist hier. WID verfolgt deinen Fortschritt automatisch.',
  step2Title: 'Linguu — Deutsch lernen', step2Body: 'Öffne linguu.techstag.de und gib deinen WID-Code ein.', step2Code: 'Dein WID-Code',
  step3Title: 'JobMate — Arbeit finden', step3Body: 'Öffne jobmate.techstag.de und verbessere deinen Lebenslauf mit KI.',
}

interface Props {
  lang: NativeLanguage
  participantCode: string
}

export default function GuideSection({ lang, participantCode }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const t = T[lang] ?? T.en
  const isRtl = lang === 'ar' || lang === 'ku'
  const linguuUrl = `https://linguu.techstag.de?wid=${participantCode}`
  const jobmateUrl = `https://jobmate.techstag.de?wid=${participantCode}`

  function copyCode() {
    navigator.clipboard.writeText(participantCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    {
      num: 1,
      icon: LayoutDashboard,
      color: 'var(--primary)',
      bg: 'rgba(37,99,235,0.08)',
      border: 'rgba(37,99,235,0.2)',
      title: t.step1Title,
      titleDE: DE.step1Title,
      body: t.step1Body,
      bodyDE: DE.step1Body,
      extra: null,
    },
    {
      num: 2,
      icon: BookOpen,
      color: '#16a34a',
      bg: 'rgba(22,163,74,0.08)',
      border: 'rgba(22,163,74,0.2)',
      title: t.step2Title,
      titleDE: DE.step2Title,
      body: t.step2Body,
      bodyDE: DE.step2Body,
      extra: (
        <div className="mt-3 rounded-xl p-3 flex items-center gap-3"
          style={{ background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)' }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#16a34a' }}>
              {t.step2Code}
            </p>
            {t.step2Code !== DE.step2Code && (
              <p className="text-xs mb-1" style={{ color: '#16a34a', opacity: 0.65 }}>{DE.step2Code}</p>
            )}
            <span className="text-2xl font-bold tracking-widest" style={{ fontFamily: 'Fira Code, monospace', color: '#16a34a' }}>
              {participantCode}
            </span>
          </div>
          <button onClick={copyCode}
            className="ml-auto p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(22,163,74,0.15)', color: copied ? '#22c55e' : '#16a34a' }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <a href={linguuUrl} target="_blank" rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a', textDecoration: 'none', border: '1.5px solid rgba(22,163,74,0.3)' }}>
          <BookOpen size={14} />
          Linguu öffnen →
        </a>
      ),
    },
    {
      num: 3,
      icon: Briefcase,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      title: t.step3Title,
      titleDE: DE.step3Title,
      body: t.step3Body,
      bodyDE: DE.step3Body,
      extra: (
        <a href={jobmateUrl} target="_blank" rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', textDecoration: 'none', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex' }}>
          <Briefcase size={14} />
          JobMate öffnen →
        </a>
      ),
    },
  ]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Toggle-Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:opacity-80"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: 'rgba(37,99,235,0.1)', fontSize: 18 }}>
            📖
          </div>
          <div dir={isRtl ? 'rtl' : 'ltr'}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.heading}</p>
            {t.heading !== DE.heading && (
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.65 }}>{DE.heading}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0" style={{ color: 'var(--muted)' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Steps — collapsed by default */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="pt-4 space-y-3">
            {steps.map(({ num, icon: Icon, color, bg, border, title, titleDE, body, bodyDE, extra }) => (
              <div key={num} className="flex gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Step number */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: bg, color, border: `2px solid ${border}` }}>
                    {num}
                  </div>
                  {num < 3 && (
                    <div className="w-0.5 h-full mt-2" style={{ background: 'var(--border)', minHeight: 24 }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: bg }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
                      {title !== titleDE && (
                        <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.65 }}>{titleDE}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{body}</p>
                  {body !== bodyDE && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.65, lineHeight: 1.5 }}>{bodyDE}</p>
                  )}
                  {extra}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
