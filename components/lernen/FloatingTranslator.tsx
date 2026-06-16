'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Volume2, VolumeX, Languages, Mic, Square } from 'lucide-react'

type Lang = 'de' | 'ar' | 'uk' | 'es' | 'en' | 'tr' | 'pl' | 'ro' | 'ru' | 'ku'

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'ro', label: 'Română',     flag: '🇷🇴' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'ku', label: 'Kurdî',      flag: '🏔️' },
]

const TTS_VOICE: Partial<Record<Lang, string>> = {
  de: 'nova', en: 'alloy', ar: 'shimmer', uk: 'shimmer',
  es: 'nova',  tr: 'echo', pl: 'echo',    ro: 'echo', ru: 'shimmer',
}

// Lazy ausgewertet — NICHT auf Modul-Ebene: `MediaRecorder` ist ein Browser-Global
// und existiert beim Server-Side-Rendering nicht. Ein Modul-Level-Zugriff würde den
// gesamten Lernbereich (Layout) beim SSR mit "MediaRecorder is not defined" crashen.
function getSupportedMime(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'audio/webm'
  }
  return MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'
}

interface PanelState {
  listening: boolean
  processing: boolean
  transcript: string
  translation: string
}

const EMPTY: PanelState = { listening: false, processing: false, transcript: '', translation: '' }

async function translateText(text: string, from: Lang, to: Lang, onChunk: (c: string) => void) {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, from, to }),
  })
  if (!res.body) return
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(dec.decode(value, { stream: true }))
  }
}

async function whisper(blob: Blob, lang: Lang): Promise<string> {
  const form = new FormData()
  const ext = blob.type.includes('webm') ? 'webm' : 'ogg'
  form.append('audio', new File([blob], `audio.${ext}`, { type: blob.type }))
  form.append('lang', lang)
  const res = await fetch('/api/whisper', { method: 'POST', body: form })
  const data = await res.json()
  return data.text ?? ''
}

async function speak(text: string, lang: Lang) {
  const voice = TTS_VOICE[lang] ?? 'nova'
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  await audio.play()
  audio.onended = () => URL.revokeObjectURL(url)
}

function usePanel(lang: Lang, toLang: Lang, voiceOutput: boolean) {
  const [state, setState] = useState<PanelState>(EMPTY)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const toggle = useCallback(async () => {
    if (state.listening) {
      recorderRef.current?.stop()
      return
    }

    setState(s => ({ ...s, transcript: '', translation: '' }))
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState(s => ({ ...s, transcript: 'Kein Mikrofon-Zugriff.' }))
      return
    }

    const mime = getSupportedMime()
    const recorder = new MediaRecorder(stream, { mimeType: mime })
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setState(s => ({ ...s, listening: false, processing: true }))
      try {
        const blob = new Blob(chunksRef.current, { type: mime })
        const text = await whisper(blob, lang)
        setState(s => ({ ...s, transcript: text }))
        let full = ''
        await translateText(text, lang, toLang, chunk => {
          full += chunk
          setState(s => ({ ...s, translation: full }))
        })
        if (voiceOutput && full) {
          try { await speak(full, toLang) } catch { /* ignore */ }
        }
      } catch {
        setState(s => ({ ...s, transcript: '— Fehler beim Übersetzen —' }))
      } finally {
        setState(s => ({ ...s, processing: false }))
      }
    }

    recorder.start()
    setState(s => ({ ...s, listening: true }))

    // Auto-Stop nach 15s
    setTimeout(() => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }, 15000)
  }, [state.listening, lang, toLang, voiceOutput])

  return { state, toggle }
}

interface PanelProps {
  lang: Lang
  toLang: Lang
  onLangChange: (l: Lang) => void
  voiceOutput: boolean
}

function Panel({ lang, toLang, onLangChange, voiceOutput }: PanelProps) {
  const { state, toggle } = usePanel(lang, toLang, voiceOutput)
  const isRtl = lang === 'ar'
  const isRtlOut = toLang === 'ar'

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <select
          value={lang}
          onChange={e => onLangChange(e.target.value as Lang)}
          style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text)',
            fontSize: 13,
            padding: '6px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={toggle}
          disabled={state.processing}
          title={state.listening ? 'Aufnahme stoppen' : 'Aufnahme starten'}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: state.listening ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.14)',
            outline: state.listening ? '2px solid rgba(239,68,68,0.5)' : '2px solid rgba(99,102,241,0.35)',
            cursor: state.processing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
            animation: state.listening ? 'wid-pulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          {state.processing
            ? <span style={{ fontSize: 18 }}>⏳</span>
            : state.listening
              ? <Square size={18} color="#ef4444" fill="#ef4444" />
              : <Mic size={18} color="#6366f1" />
          }
        </button>
      </div>

      <div style={{ minHeight: 52 }}>
        {state.listening && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'wid-blink 1s infinite' }} />
            Aufnahme läuft…
          </p>
        )}
        {state.processing && !state.transcript && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Erkenne Sprache…</p>
        )}
        {!state.transcript && !state.listening && !state.processing && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, textAlign: 'center', opacity: 0.5 }}>
            Mikrofon antippen um zu sprechen
          </p>
        )}
        {state.transcript && (
          <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 6px', direction: isRtl ? 'rtl' : 'ltr', lineHeight: 1.4 }}>
            {state.transcript}
          </p>
        )}
        {state.translation && (
          <p style={{
            fontSize: 13, color: 'var(--primary)', margin: 0,
            direction: isRtlOut ? 'rtl' : 'ltr', lineHeight: 1.4,
            borderLeft: isRtlOut ? 'none' : '2px solid rgba(99,102,241,0.4)',
            borderRight: isRtlOut ? '2px solid rgba(99,102,241,0.4)' : 'none',
            paddingLeft: isRtlOut ? 0 : 8,
            paddingRight: isRtlOut ? 8 : 0,
          }}>
            {state.translation}
          </p>
        )}
      </div>
    </div>
  )
}

export function FloatingTranslator({ nativeLang }: { nativeLang?: string }) {
  const [open, setOpen] = useState(false)
  const [voiceOutput, setVoiceOutput] = useState(false)
  const [langA, setLangA] = useState<Lang>('de')
  const [langB, setLangB] = useState<Lang>(() => {
    if (nativeLang && nativeLang !== 'de') return nativeLang as Lang
    return 'ar'
  })

  useEffect(() => {
    if (nativeLang && nativeLang !== 'de') setLangB(nativeLang as Lang)
  }, [nativeLang])

  return (
    <>
      <style>{`
        @keyframes wid-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%        { opacity: 0.75; transform: scale(0.94); }
        }
        @keyframes wid-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {/* Floating Button — mit Label damit man sieht was es ist */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Simultanübersetzer öffnen"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            height: 52,
            paddingLeft: 16,
            paddingRight: 20,
            borderRadius: 26,
            background: 'var(--primary)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Languages size={20} />
          <span>Übersetzer</span>
        </button>
      )}

      {/* Geöffnetes Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            width: 'min(370px, calc(100vw - 32px))',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(99,102,241,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Languages size={18} color="var(--primary)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Simultanübersetzer
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setVoiceOutput(v => !v)}
                title={voiceOutput ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'}
                style={{
                  background: voiceOutput ? 'rgba(99,102,241,0.2)' : 'var(--surface-2)',
                  border: voiceOutput ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  borderRadius: 8,
                  color: voiceOutput ? 'var(--primary)' : 'var(--muted)',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {voiceOutput ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--muted)',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Person A */}
          <Panel lang={langA} toLang={langB} onLangChange={setLangA} voiceOutput={voiceOutput} />

          {/* Divider mit Richtungspfeil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 18, color: 'var(--muted)' }}>⇅</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Person B */}
          <Panel lang={langB} toLang={langA} onLangChange={setLangB} voiceOutput={voiceOutput} />
        </div>
      )}
    </>
  )
}
