'use client'

import { createContext, useContext, useState } from 'react'
import type { NativeLanguage } from '@/types'

export interface ParticipantContextValue {
  fullName: string
  nativeLang: NativeLanguage
  participantCode: string
  /** Schaltet die Sprache clientseitig sofort um (alle Consumer rendern neu). */
  setNativeLang: (lang: NativeLanguage) => void
}

const ParticipantContext = createContext<ParticipantContextValue | null>(null)

export function ParticipantProvider({
  value,
  children,
}: {
  value: { fullName: string; nativeLang: NativeLanguage; participantCode: string }
  children: React.ReactNode
}) {
  // nativeLang als State → Sprachwechsel ist instant, ohne Server-Re-Render.
  // Initialwert kommt vom Server (Layout); bei Reload wird er wieder frisch geladen.
  const [nativeLang, setNativeLang] = useState<NativeLanguage>(value.nativeLang)

  return (
    <ParticipantContext.Provider
      value={{
        fullName: value.fullName,
        participantCode: value.participantCode,
        nativeLang,
        setNativeLang,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  )
}

/**
 * Liest die im Layout einmal geladenen Teilnehmer-Daten clientseitig.
 * Erlaubt statischen Tabs (Linguu, JobMate) instant-Navigation ohne Server-Roundtrip.
 */
export function useParticipant(): ParticipantContextValue {
  const ctx = useContext(ParticipantContext)
  if (!ctx) throw new Error('useParticipant muss innerhalb von ParticipantProvider verwendet werden')
  return ctx
}
