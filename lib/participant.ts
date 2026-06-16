import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NativeLanguage } from '@/types'

export interface Participant {
  id: string
  fullName: string
  nativeLang: NativeLanguage
  participantCode: string
}

/**
 * Lädt den eingeloggten Teilnehmer (Auth-User + Profil) genau einmal pro Request.
 * `cache()` dedupliziert innerhalb eines Server-Renders — Layout und Seite teilen
 * sich denselben Fetch, statt jeweils getUser() + profiles-Query doppelt zu machen.
 * Gibt null zurück, wenn nicht eingeloggt oder kein Profil → Aufrufer redirected.
 */
export const getParticipant = cache(async (): Promise<Participant | null> => {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, native_language, participant_code')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    fullName: profile.full_name ?? '',
    nativeLang: (profile.native_language ?? 'en') as NativeLanguage,
    participantCode: profile.participant_code ?? '',
  }
})
