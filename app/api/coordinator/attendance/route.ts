import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Koordinator/Admin stempelt einen Teilnehmer ein/aus (falls vergessen).
// Auth-Pattern: createClient nur für getUser(), createAdminClient für DB.

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const db = createAdminClient()
  const { data: coord } = await db
    .from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!coord || !['coordinator', 'global_admin'].includes(coord.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const { participant_id, action } = await req.json()

  // Teilnehmer muss zur selben Org gehören (global_admin darf alle)
  const participantQuery = db
    .from('profiles').select('id, organization_id').eq('id', participant_id).eq('role', 'participant')
  const { data: participant } = await participantQuery.single()
  if (!participant) return NextResponse.json({ error: 'Teilnehmer nicht gefunden' }, { status: 404 })
  if (coord.role !== 'global_admin' && participant.organization_id !== coord.organization_id) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const date = todayISO()

  if (action === 'check_in') {
    const { data: org } = await db
      .from('organizations').select('expected_start_time').eq('id', participant.organization_id).single()
    const expected = (org?.expected_start_time ?? '09:00:00') as string
    const [eh, em] = expected.split(':').map(Number)
    const now = new Date()
    const wasLate = now.getHours() * 60 + now.getMinutes() > eh * 60 + em

    const { data, error } = await db.from('attendance').upsert({
      user_id: participant.id, organization_id: participant.organization_id,
      date, check_in: now.toISOString(), was_late: wasLate,
    }, { onConflict: 'user_id,date' }).select('check_in, check_out, was_late').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ today: data })
  }

  if (action === 'check_out') {
    const { data, error } = await db.from('attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('user_id', participant.id).eq('date', date)
      .select('check_in, check_out, was_late').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ today: data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// GET ?participant_id= → heutiger Status (für die Koordinator-Buttons)
export async function GET(req: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const db = createAdminClient()
  const { data: coord } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (!coord || !['coordinator', 'global_admin'].includes(coord.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const participant_id = new URL(req.url).searchParams.get('participant_id')
  const { data } = await db.from('attendance')
    .select('check_in, check_out, was_late')
    .eq('user_id', participant_id).eq('date', todayISO()).maybeSingle()
  return NextResponse.json({ today: data ?? null })
}
