'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Briefcase, LogOut } from 'lucide-react'
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

interface Props {
  userName: string
  nativeLang: NativeLanguage
}

export default function ParticipantNav({ userName, nativeLang }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const labels = MODULE_LABELS[nativeLang] ?? MODULE_LABELS.en

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
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

        <div className="flex items-center gap-2">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--muted)' }}>
            {NATIVE_LANGUAGE_NATIVE[nativeLang]}
          </span>
          <button onClick={signOut} className="p-2 rounded-lg cursor-pointer" style={{ color: 'var(--muted)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
