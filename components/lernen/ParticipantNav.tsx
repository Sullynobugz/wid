'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Briefcase, LogOut, Check, LayoutDashboard, Landmark, User } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { NATIVE_LANGUAGE_NATIVE } from '@/types'
import { useParticipant } from './ParticipantProvider'

const LANGUAGE_FLAGS: Record<NativeLanguage, string> = {
  ar: '🇸🇦',
  uk: '🇺🇦',
  es: '🇪🇸',
  en: '🇬🇧',
  ku: '🏔️',
  tr: '🇹🇷',
  pl: '🇵🇱',
  ro: '🇷🇴',
  ru: '🇷🇺',
  de: '🇩🇪',
}

const MODULE_LABELS: Record<NativeLanguage, { hub: string; linguu: string; jobs: string; einbuergerung: string }> = {
  ar: { hub: 'المركز', linguu: 'لينغو', jobs: 'عمل', einbuergerung: 'توجيه' },
  uk: { hub: 'Центр', linguu: 'Лінгу', jobs: 'Робота', einbuergerung: 'Орієнтація' },
  es: { hub: 'Centro', linguu: 'Linguu', jobs: 'Trabajo', einbuergerung: 'Orientación' },
  en: { hub: 'Hub', linguu: 'Linguu', jobs: 'Jobs', einbuergerung: 'Orientation' },
  ku: { hub: 'Navend', linguu: 'Linguu', jobs: 'Kar', einbuergerung: 'Rêberî' },
  tr: { hub: 'Merkez', linguu: 'Linguu', jobs: 'İş', einbuergerung: 'Rehberlik' },
  pl: { hub: 'Centrum', linguu: 'Linguu', jobs: 'Praca', einbuergerung: 'Orientacja' },
  ro: { hub: 'Centru', linguu: 'Linguu', jobs: 'Muncă', einbuergerung: 'Orientare' },
  ru: { hub: 'Центр', linguu: 'Лингуу', jobs: 'Работа', einbuergerung: 'Ориентация' },
  de: { hub: 'Übersicht', linguu: 'Sprache', jobs: 'Arbeit', einbuergerung: 'Orientierung' },
}

const DE_NAV = { hub: 'Übersicht', linguu: 'Sprache', jobs: 'Arbeit', einbuergerung: 'Orientierung' }
const ALL_LANGUAGES: NativeLanguage[] = ['de', 'ar', 'uk', 'es', 'en', 'ku', 'tr', 'pl', 'ro', 'ru']

const PILLARS = [
  { href: '/lernen',                 tabKey: null,        key: 'hub' as const,           productName: 'Enter',     icon: LayoutDashboard, color: '#6366f1' },
  { href: '/lernen?tab=linguu',      tabKey: 'linguu',    key: 'linguu' as const,        productName: 'Linguu',    icon: BookOpen,        color: '#10b981' },
  { href: '/lernen?tab=jobs',        tabKey: 'jobs',      key: 'jobs' as const,          productName: 'JobMate',   icon: Briefcase,       color: '#f59e0b' },
  { href: '/lernen/einbuergerung',   tabKey: null,        key: 'einbuergerung' as const, productName: 'Orientierung', icon: Landmark,        color: '#8b5cf6' },
]

interface Props {
  userName: string
}

export default function ParticipantNav({ userName }: Props) {
  const { nativeLang, setNativeLang } = useParticipant()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') ?? ''
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const labels = MODULE_LABELS[nativeLang] ?? MODULE_LABELS.en
  const currentFlag = LANGUAGE_FLAGS[nativeLang] ?? '🌐'
  const currentLanguageLabel = NATIVE_LANGUAGE_NATIVE[nativeLang] ?? 'Sprache'

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function changeLanguage(lang: NativeLanguage) {
    if (lang === nativeLang || saving) return
    setShowLangMenu(false)
    setNativeLang(lang)          // optimistisch: schaltet sofort alle Consumer um
    setSaving(true)
    try {
      // im Hintergrund persistieren — kein router.refresh(), also kein Server-Roundtrip
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ native_language: lang }),
      })
    } finally {
      setSaving(false)
    }
  }

  function isActive(tabKey: string | null, href: string) {
    if (tabKey) return pathname === '/lernen' && currentTab === tabKey
    if (href === '/lernen') return pathname === '/lernen' && !currentTab
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="sticky top-0 z-30 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* ── Row 1: Top bar ── */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between gap-3">

          {/* Logo */}
          <Link
            href="/lernen"
            className="flex items-center gap-2 font-bold text-sm cursor-pointer flex-shrink-0"
            style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)', textDecoration: 'none' }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--primary)' }}
            >
              E
            </div>
            <span className="hidden sm:inline leading-none">Enter</span>
          </Link>

          {/* Mitte: Account-Name */}
          <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
            <User size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text)' }}
              title={userName}
            >
              {userName}
            </span>
          </div>

          {/* Rechts: Sprachauswahl + Logout */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Sprachauswahl — prominent mit Flagge */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{
                  background: showLangMenu ? 'rgba(99,102,241,0.12)' : 'var(--surface-2)',
                  color: showLangMenu ? 'var(--primary)' : 'var(--text)',
                  border: `1.5px solid ${showLangMenu ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-base leading-none"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
                  }}
                >
                  {currentFlag}
                </span>
                <span className="hidden sm:inline text-sm">{currentLanguageLabel}</span>
                {saving ? (
                  <span
                    className="inline-block rounded-full animate-spin"
                    style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--primary)' }}
                    aria-label="Speichert…"
                  />
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>▾</span>
                )}
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                      minWidth: 190,
                    }}
                  >
                    <div className="p-1">
                      {ALL_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => changeLanguage(lang)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer transition-colors"
                          style={{
                            background: lang === nativeLang ? 'rgba(99,102,241,0.08)' : 'transparent',
                            color: lang === nativeLang ? 'var(--primary)' : 'var(--text)',
                          }}
                        >
                          <span
                            className="text-xl leading-none w-7 text-center"
                            style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
                          >
                            {LANGUAGE_FLAGS[lang] ?? '🌐'}
                          </span>
                          <span className="flex-1 font-medium">{NATIVE_LANGUAGE_NATIVE[lang]}</span>
                          {lang === nativeLang && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg cursor-pointer transition-colors"
              style={{ color: 'var(--muted)' }}
              title="Abmelden"
              aria-label="Abmelden"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: Pillar switcher ── */}
      <div className="max-w-4xl mx-auto px-3 py-2.5">
        <div className="grid grid-cols-4 gap-2">
          {PILLARS.map(({ href, tabKey, key, productName, icon: Icon, color }) => {
            const active = isActive(tabKey, href)
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
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{ background: active ? `${color}22` : `${color}12` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="text-center leading-none">
                  <p className="font-bold text-sm leading-tight" style={{ color: active ? color : 'var(--text)' }}>
                    {productName}
                  </p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: active ? `${color}cc` : 'var(--muted)' }}>
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
