'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { codeToEmail } from '@/lib/passwords'

type Tab = 'participant' | 'coordinator'

const LABELS = {
  participant: {
    tab: 'Teilnehmer',
    tab_sub: 'مشارك • Учасник • Katılımcı',
    code_label: 'Ihr Code / Your Code / كودك',
    code_placeholder: 'WID-XXXXX',
    pass_label: 'Passwort / Password / كلمة المرور',
    submit: 'Anmelden',
  },
  coordinator: {
    tab: 'Koordinator',
    tab_sub: 'Für Träger & Einrichtungen',
    code_label: 'E-Mail',
    code_placeholder: 'name@einrichtung.de',
    pass_label: 'Passwort',
    submit: 'Anmelden',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('participant')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const l = LABELS[tab]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const email = tab === 'participant' ? codeToEmail(code.trim().toUpperCase()) : code.trim()
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(tab === 'participant'
        ? 'Code oder Passwort falsch. / Wrong code or password.'
        : 'E-Mail oder Passwort falsch.'
      )
      setLoading(false)
      return
    }

    router.refresh()
    router.push(tab === 'coordinator' ? '/coordinator' : '/lernen')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--primary)' }}>
              W
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Fira Code, monospace' }}>WID</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Willkommen in Deutschland</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex mb-6 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {(['participant', 'coordinator'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setCode(''); setPassword('') }}
                className="flex-1 py-3 text-sm font-medium transition-colors cursor-pointer"
                style={{
                  background: tab === t ? 'var(--primary)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--muted)',
                }}
              >
                {LABELS[t].tab}
              </button>
            ))}
          </div>

          <p className="text-xs mb-5 text-center" style={{ color: 'var(--muted)' }}>{l.tab_sub}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>{l.code_label}</label>
              <input
                type={tab === 'coordinator' ? 'email' : 'text'}
                placeholder={l.code_placeholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="username"
                style={{ textTransform: tab === 'participant' ? 'uppercase' : 'none' }}
              />
            </div>

            <div>
              <label>{l.pass_label}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm py-2 px-3 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : l.submit}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          WID · Mamooon UG · Powered by TechStag
        </p>
      </div>
    </div>
  )
}
