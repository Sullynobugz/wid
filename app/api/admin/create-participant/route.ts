import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateParticipantCode, generatePassword, codeToEmail } from '@/lib/passwords'
import type { NativeLanguage } from '@/types'

export async function POST(req: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'global_admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { full_name, native_language, org_id } = await req.json() as {
    full_name: string
    native_language: NativeLanguage
    org_id: string
  }

  if (!full_name?.trim()) return NextResponse.json({ error: 'Name fehlt' }, { status: 400 })
  if (!org_id) return NextResponse.json({ error: 'Organisation fehlt' }, { status: 400 })

  const code = generateParticipantCode()
  const password = generatePassword()
  const email = codeToEmail(code)

  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Auth-Fehler' }, { status: 500 })
  }

  const { error: profileError } = await db.from('profiles').insert({
    id: authUser.user.id,
    organization_id: org_id,
    full_name: full_name.trim(),
    participant_code: code,
    role: 'participant',
    native_language: native_language ?? 'ar',
  })

  if (profileError) {
    await db.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ participant_code: code, password, full_name: full_name.trim() })
}
