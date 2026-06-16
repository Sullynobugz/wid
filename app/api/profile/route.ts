import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { native_language } = body

  const valid = ['ar', 'uk', 'es', 'en', 'ku', 'tr', 'pl', 'ro', 'ru', 'de']
  if (native_language && !valid.includes(native_language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  const db = createAdminClient()
  const update: Record<string, string> = {}
  if (native_language) update.native_language = native_language

  const { error } = await db.from('profiles').update(update).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
