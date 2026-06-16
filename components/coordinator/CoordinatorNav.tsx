'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, LogOut, ShieldAlert } from 'lucide-react'

interface Props {
  userName: string
  orgName: string
  isGlobalAdmin?: boolean
}

export default function CoordinatorNav({ userName, orgName, isGlobalAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/coordinator', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/coordinator/teilnehmer', label: 'Teilnehmer', icon: Users },
  ]

  return (
    <nav className="border-b sticky top-0 z-30" style={{ background: 'white', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/coordinator" className="flex items-center gap-2 font-bold text-base mr-2"
          style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--primary)' }}>W</div>
          Enter
        </Link>

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

        <div className="flex items-center gap-3">
          {isGlobalAdmin && (
            <Link href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <ShieldAlert size={13} />
              Admin
            </Link>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none" style={{ color: 'var(--text)' }}>{userName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{orgName}</p>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--muted)' }}
            title="Abmelden">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
