'use client'

import { useEffect, useState } from 'react'
import { LogIn, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Today { check_in: string | null; check_out: string | null; was_late: boolean | null }

function hhmm(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''
}

export default function CoordinatorStamp({ participantId }: { participantId: string }) {
  const [today, setToday] = useState<Today | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/coordinator/attendance?participant_id=${participantId}`)
      .then(r => r.ok ? r.json() : { today: null })
      .then(d => setToday(d.today))
      .catch(() => setToday(null))
  }, [participantId])

  async function stamp(action: 'check_in' | 'check_out') {
    setBusy(true)
    try {
      const r = await fetch('/api/coordinator/attendance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId, action }),
      })
      const d = await r.json()
      if (r.ok) setToday(d.today)
    } finally {
      setBusy(false)
    }
  }

  if (today === undefined) return null

  const checkedIn = !!today?.check_in
  const checkedOut = !!today?.check_out

  return (
    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        {checkedIn ? (
          <span className="inline-flex items-center gap-1">
            {today!.was_late
              ? <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />
              : <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />}
            Heute {hhmm(today!.check_in)}{checkedOut ? `–${hhmm(today!.check_out)}` : ' (anwesend)'}
          </span>
        ) : 'Heute noch nicht gestempelt'}
      </span>
      <div className="flex items-center gap-2">
        {!checkedIn ? (
          <button onClick={() => stamp('check_in')} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{ background: 'var(--primary)', color: '#fff', opacity: busy ? 0.6 : 1 }}>
            <LogIn size={13} /> Einstempeln
          </button>
        ) : !checkedOut ? (
          <button onClick={() => stamp('check_out')} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', opacity: busy ? 0.6 : 1 }}>
            <LogOut size={13} /> Ausstempeln
          </button>
        ) : null}
      </div>
    </div>
  )
}
