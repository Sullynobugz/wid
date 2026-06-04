import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateParticipantCode, generatePassword, codeToEmail } from '@/lib/passwords'
import type { NativeLanguage } from '@/types'

interface ParticipantInput {
  full_name: string
  native_language: NativeLanguage
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: coordinator } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (coordinator?.role !== 'coordinator') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { participants } = await req.json() as { participants: ParticipantInput[] }
  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: 'Keine Teilnehmer' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
  const created = []

  for (const p of participants) {
    const name = p.full_name.trim()
    if (!name) continue

    const code = generateParticipantCode()
    const password = generatePassword()
    const email = codeToEmail(code)

    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authUser.user) continue

    await serviceClient.from('profiles').insert({
      id: authUser.user.id,
      organization_id: coordinator.organization_id,
      full_name: name,
      participant_code: code,
      role: 'participant',
      native_language: p.native_language ?? 'ar',
    })

    created.push({ full_name: name, participant_code: code, password, native_language: p.native_language })
  }

  return NextResponse.json({ created })
}
