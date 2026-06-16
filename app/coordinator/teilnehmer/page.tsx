'use client'

import { useState } from 'react'
import { Upload, Printer, Plus, Trash2, CheckCircle, Loader } from 'lucide-react'
import { NATIVE_LANGUAGE_LABELS, type NativeLanguage } from '@/types'

interface ParticipantInput {
  full_name: string
  native_language: NativeLanguage
}

interface CreatedParticipant {
  full_name: string
  participant_code: string
  password: string
  native_language: NativeLanguage
}

const LANGUAGES = Object.entries(NATIVE_LANGUAGE_LABELS) as [NativeLanguage, string][]

export default function TeilnehmerPage() {
  const [inputs, setInputs] = useState<ParticipantInput[]>([
    { full_name: '', native_language: 'ar' },
  ])
  const [created, setCreated] = useState<CreatedParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addRow() {
    setInputs(p => [...p, { full_name: '', native_language: 'ar' }])
  }

  function removeRow(i: number) {
    setInputs(p => p.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof ParticipantInput, value: string) {
    setInputs(p => p.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, i: number) {
    const text = e.clipboardData.getData('text')
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length <= 1) return
    e.preventDefault()
    const newRows: ParticipantInput[] = lines.map(name => ({ full_name: name, native_language: 'ar' }))
    setInputs(p => {
      const copy = [...p]
      copy.splice(i, 1, ...newRows)
      return copy
    })
  }

  async function handleCreate() {
    const valid = inputs.filter(r => r.full_name.trim())
    if (!valid.length) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/coordinator/participants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ participants: valid }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler beim Anlegen.')
      setLoading(false)
      return
    }

    const { created: result } = await res.json()
    setCreated(result)
    setLoading(false)
  }

  if (created.length > 0) {
    return <CredentialsSheet participants={created} onReset={() => { setCreated([]); setInputs([{ full_name: '', native_language: 'ar' }]) }} />
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl mb-1">Teilnehmer anlegen</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Namen eingeben oder aus Excel/Word einfügen. Zugangsdaten werden automatisch erstellt.
        </p>
      </div>

      <div className="card mb-4">
        <div className="space-y-2">
          {inputs.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Vor- und Nachname"
                value={row.full_name}
                onChange={e => updateRow(i, 'full_name', e.target.value)}
                onPaste={e => handlePaste(e, i)}
                style={{ width: 'auto', flex: 1, minWidth: 0 }}
              />
              <select
                value={row.native_language}
                onChange={e => updateRow(i, 'native_language', e.target.value as NativeLanguage)}
                style={{ width: '9rem', flexShrink: 0 }}
              >
                {LANGUAGES.map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              {inputs.length > 1 && (
                <button onClick={() => removeRow(i)} className="p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ color: 'var(--muted)' }}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors"
          style={{ color: 'var(--primary)' }}>
          <Plus size={15} />
          Weitere Person
        </button>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg mb-6 text-sm"
        style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
        <Upload size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
        <span style={{ color: 'var(--text)' }}>
          Tipp: Mehrere Namen auf einmal aus Excel kopieren und in das erste Namensfeld einfügen — alle werden automatisch als separate Zeilen erkannt.
        </span>
      </div>

      {error && (
        <p className="text-sm py-2 px-3 rounded-lg mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>
          {error}
        </p>
      )}

      <button onClick={handleCreate} className="btn-primary" disabled={loading || !inputs.some(r => r.full_name.trim())}>
        {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {loading ? 'Wird angelegt…' : `${inputs.filter(r => r.full_name.trim()).length} Teilnehmer anlegen`}
      </button>
    </div>
  )
}

function CredentialsSheet({ participants, onReset }: {
  participants: CreatedParticipant[]
  onReset: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl">Zugangsdaten erstellt</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Blatt ausdrucken und an Teilnehmer verteilen.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer size={16} />
            Drucken
          </button>
          <button onClick={onReset}
            className="px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            Weitere anlegen
          </button>
        </div>
      </div>

      {/* Druckbarer Bereich */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {participants.map((p) => (
          <div key={p.participant_code}
            className="border rounded-xl p-5"
            style={{ borderColor: 'var(--border)', background: 'white' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--primary)' }}>E</div>
              <span className="font-bold text-sm" style={{ fontFamily: 'Fira Code, monospace' }}>Enter</span>
              <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>Sprache · Arbeit · Orientierung</span>
            </div>

            <p className="font-semibold text-base mb-3">{p.full_name}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Code / الرمز / Код</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{p.participant_code}</span>
              </div>
              <div className="flex justify-between py-2">
                <span style={{ color: 'var(--muted)' }}>Passwort / كلمة المرور</span>
                <span className="font-mono font-bold">{p.password}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              App öffnen: <span className="font-medium" style={{ color: 'var(--text)' }}>wid.techstag.de</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
