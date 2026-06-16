import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Anwesenheits-Stempeln für eingeloggte Teilnehmer.
// Auth-Pattern: createClient nur für getUser(), createAdminClient für DB.

function todayISO() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function getUserAndProfile() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'participant') return null
  return { db, profile }
}

// GET — heutigen Stempel-Status zurückgeben
export async function GET() {
  const ctx = await getUserAndProfile()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { db, profile } = ctx

  const { data } = await db
    .from('attendance')
    .select('check_in, check_out, was_late')
    .eq('user_id', profile.id)
    .eq('date', todayISO())
    .maybeSingle()

  return NextResponse.json({ today: data ?? null })
}

// POST { action: 'check_in' | 'check_out' }
export async function POST(req: Request) {
  const ctx = await getUserAndProfile()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { db, profile } = ctx
  const { action } = await req.json()
  const date = todayISO()

  if (action === 'check_in') {
    // Soll-Startzeit der Maßnahme laden → Pünktlichkeit bestimmen
    const { data: org } = await db
      .from('organizations')
      .select('expected_start_time')
      .eq('id', profile.organization_id)
      .single()

    const expected = (org?.expected_start_time ?? '09:00:00') as string
    const [eh, em] = expected.split(':').map(Number)
    const now = new Date()
    const wasLate = now.getHours() * 60 + now.getMinutes() > eh * 60 + em

    const { data, error } = await db
      .from('attendance')
      .upsert(
        {
          user_id: profile.id,
          organization_id: profile.organization_id,
          date,
          check_in: now.toISOString(),
          was_late: wasLate,
        },
        { onConflict: 'user_id,date' }
      )
      .select('check_in, check_out, was_late')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ today: data })
  }

  if (action === 'check_out') {
    const { data, error } = await db
      .from('attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('date', date)
      .select('check_in, check_out, was_late')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ today: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// DELETE — heutigen Stempel zurücksetzen (nur für Demo/Tests)
export async function DELETE() {
  const ctx = await getUserAndProfile()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { db, profile } = ctx
  await db.from('attendance').delete().eq('user_id', profile.id).eq('date', todayISO())
  return NextResponse.json({ ok: true })
}
