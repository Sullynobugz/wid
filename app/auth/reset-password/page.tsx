'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Mindestens 8 Zeichen.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError('Fehler: ' + updateError.message); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'var(--primary)' }}>E</div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Fira Code, monospace' }}>Enter</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Neues Passwort setzen</p>
        </div>

        <div className="card">
          {done ? (
            <p className="text-sm py-3 px-4 rounded-lg text-center" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              Passwort geändert! Weiterleitung zum Login…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Neues Passwort</label>
                <input type="password" placeholder="Mindestens 8 Zeichen" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div>
                <label>Passwort bestätigen</label>
                <input type="password" placeholder="••••••••" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
              </div>
              {error && (
                <p className="text-sm py-2 px-3 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</p>
              )}
              <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Passwort speichern'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
