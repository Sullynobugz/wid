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
    code_label: 'Enter-Code / Your Code / كودك',
    code_placeholder: 'z. B. AB23CD',
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
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const l = LABELS[tab]

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (resetError) { setError('Fehler beim Senden. Bitte E-Mail prüfen.'); return }
    setForgotSent(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Teilnehmer: Code → interne E-Mail. Koordinator/Admin: echte E-Mail (enthält "@")
    // wird direkt genutzt; ein einfacher Name ohne "@" (z.B. Test-Logins "Coordinator"/"admin")
    // wird ebenfalls auf eine interne @wid.internal-Adresse gemappt.
    const email =
      tab === 'participant'
        ? codeToEmail(code.trim().toUpperCase())
        : code.includes('@')
          ? code.trim()
          : codeToEmail(code.trim())
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(tab === 'participant'
        ? 'Code oder Passwort falsch. / Wrong code or password.'
        : 'E-Mail oder Passwort falsch.'
      )
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    router.refresh()
    if (profile?.role === 'global_admin') router.push('/admin')
    else if (profile?.role === 'coordinator') router.push('/coordinator')
    else router.push('/lernen')
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
            <span className="text-2xl font-bold" style={{ fontFamily: 'Fira Code, monospace' }}>Enter</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sprache · Arbeit · Orientierung</p>
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

          {/* Passwort vergessen — nur Koordinator */}
          {tab === 'coordinator' && forgotMode ? (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-sm py-3 px-4 rounded-lg text-center" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                  Link gesendet! Bitte E-Mail prüfen.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label>E-Mail</label>
                    <input type="email" placeholder="name@einrichtung.de" value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  {error && (
                    <p className="text-sm py-2 px-3 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</p>
                  )}
                  <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                    {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset-Link senden'}
                  </button>
                </form>
              )}
              <button onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}
                className="w-full text-sm text-center" style={{ color: 'var(--muted)' }}>
                ← Zurück zum Login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>{l.code_label}</label>
              <input
                type="text"
                placeholder={l.code_placeholder}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete={tab === 'participant' ? 'new-password' : 'email'}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
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
                autoComplete={tab === 'participant' ? 'new-password' : 'current-password'}
              />
            </div>

            {tab === 'participant' && (
              <button
                type="button"
                onClick={() => { setCode('A'); setPassword('1') }}
                className="w-full text-xs py-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--muted)', border: '1px dashed var(--border)' }}
              >
                Test-Login verwenden (A / 1)
              </button>
            )}

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

            {tab === 'coordinator' && (
              <button type="button" onClick={() => { setForgotMode(true); setError(''); setForgotEmail(code) }}
                className="w-full text-sm text-center" style={{ color: 'var(--muted)' }}>
                Passwort vergessen?
              </button>
            )}
          </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          Enter · Mamooon UG · Powered by TechStag
        </p>
      </div>
    </div>
  )
}
