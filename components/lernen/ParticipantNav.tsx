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

const DE_NAV = { themen: 'Lernen', linguu: 'Linguu', jobs: 'Jobs' }

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

  const navLinks = [
    { href: '/lernen/themen', nativeLabel: labels.themen, deLabel: DE_NAV.themen, icon: GraduationCap },
    { href: '/lernen/linguu', nativeLabel: labels.linguu, deLabel: DE_NAV.linguu, icon: BookOpen },
    { href: '/lernen/jobs', nativeLabel: labels.jobs, deLabel: DE_NAV.jobs, icon: Briefcase },
  ]

  function isActive(href: string) {
    if (href === '/lernen/themen') return pathname === '/lernen/themen' || pathname.startsWith('/lernen/') && !pathname.startsWith('/lernen/linguu') && !pathname.startsWith('/lernen/jobs') && pathname !== '/lernen'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="border-b sticky top-0 z-30" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* WID Logo → Hub */}
        <Link href="/lernen" className="flex items-center gap-2 font-bold text-base mr-2 cursor-pointer"
          style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)', textDecoration: 'none' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--primary)' }}>W</div>
          WID
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 flex-1">
          {navLinks.map(({ href, nativeLabel, deLabel, icon: Icon }) => {
            const active = isActive(href)
            const showDe = nativeLabel !== deLabel
            return (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style={{
                  background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted)',
                  textDecoration: 'none',
                }}>
                <Icon size={14} />
                <span className="flex flex-col leading-none">
                  <span>{nativeLabel}</span>
                  {showDe && <span className="text-[10px] opacity-60">{deLabel}</span>}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Rechte Seite */}
        <div className="flex items-center gap-1">
          {/* Sprache */}
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
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160 }}>
                  {ALL_LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => changeLanguage(lang)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left cursor-pointer transition-colors"
                      style={{
                        background: lang === nativeLang ? 'rgba(37,99,235,0.06)' : 'transparent',
                        color: lang === nativeLang ? 'var(--primary)' : 'var(--text)',
                      }}>
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
