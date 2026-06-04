import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePassword } from '@/lib/passwords'

export async function POST(req: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const db = createAdminClient()
  const { data: coordinator } = await db
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (coordinator?.role !== 'coordinator') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { participant_id } = await req.json()

  // Sicherstellen dass Teilnehmer zur selben Organisation gehört
  const { data: participant } = await db
    .from('profiles')
    .select('id, full_name, participant_code')
    .eq('id', participant_id)
    .eq('organization_id', coordinator.organization_id)
    .single()

  if (!participant) return NextResponse.json({ error: 'Teilnehmer nicht gefunden' }, { status: 404 })

  const newPassword = generatePassword()
  await db.auth.admin.updateUserById(participant_id, { password: newPassword })

  return NextResponse.json({
    full_name: participant.full_name,
    participant_code: participant.participant_code,
    password: newPassword,
  })
}
