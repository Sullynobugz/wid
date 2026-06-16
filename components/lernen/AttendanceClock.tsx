'use client'

import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'

interface Today {
  check_in: string | null
  check_out: string | null
  was_late: boolean | null
}

function hhmm(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function AttendanceClock() {
  const [today, setToday] = useState<Today | null | undefined>(undefined) // undefined = lädt
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/participant/attendance')
      .then(r => r.ok ? r.json() : { today: null })
      .then(d => setToday(d.today))
      .catch(() => setToday(null))
  }, [])

  async function reset() {
    setBusy(true)
    try {
      await fetch('/api/participant/attendance', { method: 'DELETE' })
      setToday(null)
    } finally {
      setBusy(false)
    }
  }

  async function stamp(action: 'check_in' | 'check_out') {
    setBusy(true)
    try {
      const r = await fetch('/api/participant/attendance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const d = await r.json()
      if (r.ok) setToday(d.today)
    } finally {
      setBusy(false)
    }
  }

  if (today === undefined) {
    return <div className="rounded-xl animate-pulse" style={{ height: 64, width: '100%', maxWidth: 280, background: 'var(--surface-2)' }} />
  }

  const checkedIn = !!today?.check_in
  const checkedOut = !!today?.check_out

  return (
    <div className="rounded-xl p-3 w-full" style={{ maxWidth: 300, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock size={13} style={{ color: 'var(--muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Anwesenheit heute</span>
        </div>
        <button onClick={reset} disabled={busy} title="Demo-Reset" className="cursor-pointer opacity-30 hover:opacity-70 transition-opacity">
          <RotateCcw size={12} style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      {!checkedIn ? (
        <button
          onClick={() => stamp('check_in')}
          disabled={busy}
          className="btn-primary w-full justify-center"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          <LogIn size={16} />
          Einstempeln
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {today!.was_late ? (
              <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
            ) : (
              <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
            )}
            <span>
              Eingestempelt <strong>{hhmm(today!.check_in)}</strong>
              {' · '}
              <span style={{ color: today!.was_late ? 'var(--warning)' : 'var(--success)' }}>
                {today!.was_late ? 'Verspätet' : 'Pünktlich'}
              </span>
            </span>
          </div>

          {!checkedOut ? (
            <button
              onClick={() => stamp('check_out')}
              disabled={busy}
              className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', opacity: busy ? 0.6 : 1 }}
            >
              <LogOut size={15} />
              Ausstempeln
            </button>
          ) : (
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              Ausgestempelt <strong style={{ color: 'var(--text)' }}>{hhmm(today!.check_out)}</strong> — bis morgen! 👋
            </div>
          )}
        </div>
      )}
    </div>
  )
}
