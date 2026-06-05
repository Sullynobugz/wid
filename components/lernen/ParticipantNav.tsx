'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Briefcase, LogOut, Globe, Check } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { NATIVE_LANGUAGE_NATIVE } from '@/types'

const MODULE_LABELS: Record<NativeLanguage, { learn: string; jobs: string }> = {
  ar: { learn: 'تعلّم', jobs: 'عمل' },
  uk: { learn: 'Навчання', jobs: 'Робота' },
  es: { learn: 'Aprender', jobs: 'Trabajo' },
  en: { learn: 'Learn', jobs: 'Jobs' },
  ku: { learn: 'Fêrbûn', jobs: 'Kar' },
  tr: { learn: 'Öğren', jobs: 'İş' },
  pl: { learn: 'Nauka', jobs: 'Praca' },
  ro: { learn: 'Învăță', jobs: 'Muncă' },
  ru: { learn: 'Учёба', jobs: 'Работа' },
}

const ALL_LANGUAGES: NativeLanguage[] = ['ar', 'uk', 'es', 'en', 'ku', 'tr', 'pl', 'ro', 'ru']

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

  const links = [
    { href: '/lernen', label: labels.learn, icon: BookOpen },
    { href: '/lernen/jobs', label: labels.jobs, icon: Briefcase },
  ]

  return (
    <nav className="border-b sticky top-0 z-30" style={{ background: 'white', borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-base mr-2"
          style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--primary)' }}>W</div>
          WID
        </div>

        <div className="flex items-center gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: pathname === href ? 'rgba(37,99,235,0.08)' : 'transparent',
                color: pathname === href ? 'var(--primary)' : 'var(--muted)',
              }}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
              style={{
                background: showLangMenu ? 'rgba(37,99,235,0.08)' : 'transparent',
                color: showLangMenu ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              <Globe size={15} />
              <span className="hidden sm:inline">{NATIVE_LANGUAGE_NATIVE[nativeLang]}</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                  style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 160,
                  }}
                >
                  {ALL_LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left cursor-pointer transition-colors"
                      style={{
                        background: lang === nativeLang ? 'rgba(37,99,235,0.06)' : 'transparent',
                        color: lang === nativeLang ? 'var(--primary)' : 'var(--foreground)',
                      }}
                      onMouseEnter={e => {
                        if (lang !== nativeLang) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'
                      }}
                      onMouseLeave={e => {
                        if (lang !== nativeLang) (e.currentTarget as HTMLElement).style.background = 'transparent'
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

          <button onClick={signOut} className="p-2 rounded-lg cursor-pointer" style={{ color: 'var(--muted)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
