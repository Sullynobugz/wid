'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Briefcase, LayoutDashboard, X, Copy, Check } from 'lucide-react'
import type { NativeLanguage } from '@/types'

const T: Record<NativeLanguage, {
  welcome: string
  sub: string
  codeLabel: string
  codeSub: string
  app1Title: string; app1Desc: string
  app2Title: string; app2Desc: string
  app3Title: string; app3Desc: string
  cta: string
}> = {
  ar: {
    welcome: 'مرحباً بك في Enter 👋', sub: 'هذا البرنامج يساعدك في تعلم اللغة الألمانية والعثور على عمل. لديك ثلاثة تطبيقات.',
    codeLabel: 'كود Enter الخاص بك', codeSub: 'احفظ هذا الكود — ستحتاجه في Linguu وJobMate',
    app1Title: 'Enter — مركزك', app1Desc: 'تتبع تقدمك وتواصل مع منسقك',
    app2Title: 'Linguu — تعلم الألمانية', app2Desc: 'أدخل كود Enter للمزامنة التلقائية',
    app3Title: 'JobMate — ابحث عن عمل', app3Desc: 'حسّن سيرتك الذاتية وتقدم للوظائف',
    cta: 'هيا نبدأ!',
  },
  uk: {
    welcome: 'Ласкаво просимо до Enter 👋', sub: 'Ця програма допомагає вивчити німецьку та знайти роботу. У тебе є три застосунки.',
    codeLabel: 'Твій Enter-код', codeSub: 'Збережи цей код — він потрібен у Linguu та JobMate',
    app1Title: 'Enter — твій центр', app1Desc: 'Відстежуй прогрес, спілкуйся з координатором',
    app2Title: 'Linguu — вчи німецьку', app2Desc: 'Введи Enter-код для автоматичної синхронізації',
    app3Title: 'JobMate — знайди роботу', app3Desc: 'Покращ резюме та подавай заявки',
    cta: 'Почнімо!',
  },
  es: {
    welcome: '¡Bienvenido a Enter! 👋', sub: 'Este programa te ayuda a aprender alemán y encontrar trabajo. Tienes tres aplicaciones.',
    codeLabel: 'Tu código Enter', codeSub: 'Guarda este código — lo necesitas en Linguu y JobMate',
    app1Title: 'Enter — tu centro', app1Desc: 'Sigue tu progreso y comunícate con tu coordinador',
    app2Title: 'Linguu — aprende alemán', app2Desc: 'Ingresa el código Enter para sincronización automática',
    app3Title: 'JobMate — encuentra trabajo', app3Desc: 'Mejora tu CV y postúlate a empleos',
    cta: '¡Empecemos!',
  },
  en: {
    welcome: 'Welcome to Enter 👋', sub: 'This program helps you learn German and find a job. You have three apps.',
    codeLabel: 'Your Enter code', codeSub: 'Save this code — you\'ll need it in Linguu and JobMate',
    app1Title: 'Enter — your hub', app1Desc: 'Track your progress and connect with your coordinator',
    app2Title: 'Linguu — learn German', app2Desc: 'Enter your Enter code for automatic sync',
    app3Title: 'JobMate — find a job', app3Desc: 'Improve your CV and apply to jobs',
    cta: "Let's go!",
  },
  ku: {
    welcome: 'Xêr hatî Enter 👋', sub: 'Ev bername alîkariya fêrbûna Almanî û dîtina karê dike. Sê sepanên te hene.',
    codeLabel: 'Koda Enter ya te', codeSub: 'Vê kodê hilîne — di Linguu û JobMate de pêwist e',
    app1Title: 'Enter — navenda te', app1Desc: 'Pêşkeftina xwe bişopîne û bi hevrêzkerê xwe re têkilî dayne',
    app2Title: 'Linguu — Almanî hîn bibe', app2Desc: 'Koda Enter binivîse ji bo hevdengkirina xweber',
    app3Title: 'JobMate — kar bibîne', app3Desc: 'CV-ya xwe baştir bike û serlêdanan bike',
    cta: 'Werin dest pê bikin!',
  },
  tr: {
    welcome: "Enter'e Hoş Geldin 👋", sub: 'Bu program Almanca öğrenmene ve iş bulmana yardımcı olur. Üç uygulaман var.',
    codeLabel: 'Enter kodun', codeSub: 'Bu kodu kaydet — Linguu ve JobMate\'de gerekecek',
    app1Title: 'Enter — merkezin', app1Desc: 'İlerlemenizi takip et ve koordinatörünle iletişim kur',
    app2Title: 'Linguu — Almanca öğren', app2Desc: 'Otomatik senkronizasyon için Enter kodunu gir',
    app3Title: 'JobMate — iş bul', app3Desc: 'CV\'ni geliştir ve işlere başvur',
    cta: 'Başlayalım!',
  },
  pl: {
    welcome: 'Witaj w Enter 👋', sub: 'Ten program pomaga uczyć się niemieckiego i znaleźć pracę. Masz trzy aplikacje.',
    codeLabel: 'Twój kod Enter', codeSub: 'Zapisz ten kod — będzie potrzebny w Linguu i JobMate',
    app1Title: 'Enter — Twoje centrum', app1Desc: 'Śledź postępy i komunikuj się z koordynatorem',
    app2Title: 'Linguu — ucz się niemieckiego', app2Desc: 'Wpisz kod Enter dla automatycznej synchronizacji',
    app3Title: 'JobMate — znajdź pracę', app3Desc: 'Ulepsz CV i aplikuj na oferty pracy',
    cta: 'Zaczynajmy!',
  },
  ro: {
    welcome: 'Bun venit la Enter 👋', sub: 'Acest program te ajută să înveți germana și să găsești un loc de muncă. Ai trei aplicații.',
    codeLabel: 'Codul tău Enter', codeSub: 'Salvează acest cod — ai nevoie de el în Linguu și JobMate',
    app1Title: 'Enter — centrul tău', app1Desc: 'Urmărește progresul și comunică cu coordonatorul tău',
    app2Title: 'Linguu — învață germana', app2Desc: 'Introdu codul Enter pentru sincronizare automată',
    app3Title: 'JobMate — găsește un loc de muncă', app3Desc: 'Îmbunătățește CV-ul și aplică la joburi',
    cta: 'Să începem!',
  },
  ru: {
    welcome: 'Добро пожаловать в Enter 👋', sub: 'Эта программа поможет тебе выучить немецкий и найти работу. У тебя три приложения.',
    codeLabel: 'Твой Enter-код', codeSub: 'Сохрани этот код — он нужен в Linguu и JobMate',
    app1Title: 'Enter — твой центр', app1Desc: 'Отслеживай прогресс и общайся с координатором',
    app2Title: 'Linguu — учи немецкий', app2Desc: 'Введи Enter-код для автоматической синхронизации',
    app3Title: 'JobMate — найди работу', app3Desc: 'Улучши резюме и подавай заявки',
    cta: 'Начнём!',
  },
  de: {
    welcome: 'Willkommen bei Enter 👋', sub: 'Dieses Programm hilft dir, Deutsch zu lernen und einen Job zu finden. Du hast drei Apps.',
    codeLabel: 'Dein Enter-Code', codeSub: 'Speichere diesen Code — du brauchst ihn in Linguu und JobMate',
    app1Title: 'Enter — dein Zentrum', app1Desc: 'Verfolge deinen Fortschritt und bleib mit deinem Koordinator in Kontakt',
    app2Title: 'Linguu — Deutsch lernen', app2Desc: 'Gib deinen Enter-Code für automatische Synchronisierung ein',
    app3Title: 'JobMate — Arbeit finden', app3Desc: 'Verbessere deinen Lebenslauf und bewirb dich auf Jobs',
    cta: 'Los geht\'s!',
  },
}

const DE = {
  welcome: 'Willkommen bei Enter 👋',
  sub: 'Dieses Programm hilft dir, Deutsch zu lernen und eine Arbeit zu finden. Du hast drei Apps.',
  codeLabel: 'Dein Enter-Code',
  codeSub: 'Speichere diesen Code — du brauchst ihn in Linguu und JobMate',
  app1Title: 'Enter — dein Zentrum', app1Desc: 'Verfolge deinen Fortschritt und kontaktiere deinen Koordinator',
  app2Title: 'Linguu — Deutsch lernen', app2Desc: 'Gib deinen Enter-Code ein für automatische Synchronisierung',
  app3Title: 'JobMate — Arbeit finden', app3Desc: 'Verbessere deinen Lebenslauf und bewirb dich auf Stellen',
  cta: "Los geht's!",
}

type Translations = typeof T[NativeLanguage]
const APPS = (t: Translations) => [
  { icon: LayoutDashboard, title: t.app1Title, desc: t.app1Desc, color: 'var(--primary)', bg: 'rgba(37,99,235,0.08)' },
  { icon: BookOpen, title: t.app2Title, desc: t.app2Desc, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { icon: Briefcase, title: t.app3Title, desc: t.app3Desc, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
]

interface Props {
  lang: NativeLanguage
  participantCode: string
  isNewUser: boolean
}

export default function WelcomeModal({ lang, participantCode, isNewUser }: Props) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const storageKey = `wid_welcomed_${participantCode}`

  useEffect(() => {
    if (!isNewUser) return
    const seen = localStorage.getItem(storageKey)
    if (!seen) setVisible(true)
  }, [isNewUser, storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  function copy() {
    navigator.clipboard.writeText(participantCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!visible) return null

  const t = T[lang] ?? T.en
  const isRtl = lang === 'ar' || lang === 'ku'
  const apps = APPS(t)
  const deApps = APPS(DE as unknown as Translations)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{t.welcome}</h2>
              {t.welcome !== DE.welcome && (
                <p className="text-xs font-medium" style={{ color: 'var(--muted)', opacity: 0.7 }}>{DE.welcome}</p>
              )}
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{t.sub}</p>
              {t.sub !== DE.sub && (
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.65 }}>{DE.sub}</p>
              )}
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0"
              style={{ color: 'var(--muted)' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Enter-Code */}
        <div className="mx-6 mb-4 rounded-xl p-4" style={{ background: 'rgba(37,99,235,0.08)', border: '2px solid rgba(37,99,235,0.25)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--primary)' }}>
            {t.codeLabel}
          </p>
          {t.codeLabel !== DE.codeLabel && (
            <p className="text-xs mb-2" style={{ color: 'var(--primary)', opacity: 0.65 }}>{DE.codeLabel}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-widest flex-1"
              style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
              {participantCode}
            </span>
            <button onClick={copy}
              className="p-2 rounded-lg transition-colors"
              style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.12)', color: copied ? '#22c55e' : 'var(--primary)' }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{t.codeSub}</p>
          {t.codeSub !== DE.codeSub && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.65 }}>{DE.codeSub}</p>
          )}
        </div>

        {/* 3 Apps */}
        <div className="px-6 pb-2 space-y-2">
          {apps.map(({ icon: Icon, title, desc, color, bg }, i) => {
            const deApp = deApps[i]
            return (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: bg, border: `1px solid ${color}25` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
                  {title !== deApp.title && (
                    <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{deApp.title}</p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>
                  {desc !== deApp.desc && (
                    <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.65 }}>{deApp.desc}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="px-6 py-5">
          <button onClick={dismiss}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 flex flex-col items-center gap-0"
            style={{ background: 'var(--primary)' }}>
            <span>{t.cta}</span>
            {t.cta !== DE.cta && <span className="text-xs opacity-70">{DE.cta}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
