'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Briefcase, LogOut, Globe, Check, GraduationCap } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { NATIVE_LANGUAGE_NATIVE } from '@/types'

const MODULE_LABELS: Record<NativeLanguage, { themen: string; linguu: string; jobs: string }> = {
  ar: { themen: 'تعلّم', linguu: 'لينغو', jobs: 'عمل' },
  uk: { themen: 'Навчання', linguu: 'Лінгу', jobs: 'Робота' },
  es: { themen: 'Aprender', linguu: 'Linguu', jobs: 'Trabajo' },
  en: { themen: 'Learn', linguu: 'Linguu', jobs: 'Jobs' },
  ku: { themen: 'Fêrbûn', linguu: 'Linguu', jobs: 'Kar' },
  tr: { themen: 'Öğren', linguu: 'Linguu', jobs: 'İş' },
  pl: { themen: 'Nauka', linguu: 'Linguu', jobs: 'Praca' },
  ro: { themen: 'Învaţă', linguu: 'Linguu', jobs: 'Muncă' },
  ru: { themen: 'Учёба', linguu: 'Лингуу', jobs: 'Работа' },
}

const DE_NAV = { themen: 'Lernen', linguu: 'Sprache', jobs: 'Arbeit' }
const ALL_LANGUAGES: NativeLanguage[] = ['ar', 'uk', 'es', 'en', 'ku', 'tr', 'pl', 'ro', 'ru']

const PILLARS = [
  {
    href: '/lernen/themen',
    key: 'themen' as const,
    productName: 'WID',
    icon: GraduationCap,
    color: '#6366f1',
  },
  {
    href: '/lernen/linguu',
    key: 'linguu' as const,
    productName: 'Linguu',
    icon: BookOpen,
    color: '#10b981',
  },
  {
    href: '/lernen/jobs',
    key: 'jobs' as const,
    productName: 'JobMate',
    icon: Briefcase,
    color: '#f59e0b',
  },
]

interface Props {
  userName: string
  nativeLang: NativeLanguage
}

export default function ParticipantNav({ userName, nativeLang }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const labels = MODULE_LABELS[nativeLang] ?? MODULE_LABELS.en

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function changeLanguage(lang: NativeLanguage) {
    if (lang === nativeLang || saving) return
    setSaving(true)
    setShowLangMenu(false)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ native_language: lang }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function isActive(href: string) {
    if (href === '/lernen/themen')
      return pathname === '/lernen/themen' ||
        (pathname.startsWith('/lernen/') &&
          !pathname.startsWith('/lernen/linguu') &&
          !pathname.startsWith('/lernen/jobs') &&
          pathname !== '/lernen')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="sticky top-0 z-30 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* ── Row 1: Top bar ── */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-11 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/lernen"
            className="flex items-center gap-2 font-bold text-sm cursor-pointer"
            style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)', textDecoration: 'none' }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              W
            </div>
            <div>
              <span className="leading-none">Willkommen in Deutschland</span>
              <p className="text-[10px] leading-none mt-0.5 hidden sm:block" style={{ color: 'var(--muted)' }}>
                WID · Linguu · JobMate
              </p>
            </div>
          </Link>

          {/* Rechte Seite */}
          <div className="flex items-center gap-1">
            {/* Sprachauswahl */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
                style={{
                  background: showLangMenu ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: showLangMenu ? 'var(--primary)' : 'var(--muted)',
                }}
              >
                <Globe size={15} />
                <span className="hidden sm:inline text-xs">{NATIVE_LANGUAGE_NATIVE[nativeLang]}</span>
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      minWidth: 160,
                    }}
                  >
                    {ALL_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left cursor-pointer transition-colors"
                        style={{
                          background: lang === nativeLang ? 'rgba(99,102,241,0.08)' : 'transparent',
                          color: lang === nativeLang ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        <span>{NATIVE_LANGUAGE_NATIVE[lang]}</span>
                        {lang === nativeLang && <Check size={14} style={{ color: 'var(--primary)' }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg cursor-pointer transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="Abmelden"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: Pillar switcher ── */}
      <div className="max-w-2xl mx-auto px-3 py-2.5">
        <div className="grid grid-cols-3 gap-2">
          {PILLARS.map(({ href, key, productName, icon: Icon, color }) => {
            const active = isActive(href)
            const nativeLabel = labels[key]
            const deLabel = DE_NAV[key]
            const showDe = nativeLabel !== deLabel

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: active ? `${color}14` : 'transparent',
                  border: `1.5px solid ${active ? color : 'var(--border)'}`,
                  boxShadow: active ? `0 0 16px ${color}22` : 'none',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.borderColor = `${color}80`
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                }}
              >
                {/* Icon bubble */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: active ? `${color}22` : `${color}12`,
                  }}
                >
                  <Icon size={20} style={{ color }} />
                </div>

                {/* Labels */}
                <div className="text-center leading-none">
                  <p
                    className="font-bold text-sm leading-tight"
                    style={{ color: active ? color : 'var(--text)' }}
                  >
                    {productName}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-tight"
                    style={{ color: active ? `${color}cc` : 'var(--muted)' }}
                  >
                    {nativeLabel}
                  </p>
                  {showDe && (
                    <p
                      className="text-[10px] mt-0.5 leading-tight"
                      style={{ color: active ? `${color}88` : 'var(--muted)', opacity: 0.65 }}
                    >
                      {deLabel}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
