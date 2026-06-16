import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function guardAdmin() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const db = createAdminClient()
  const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'global_admin') return null
  return db
}

export async function GET() {
  const db = await guardAdmin()
  if (!db) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await db
    .from('org_pipeline')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const db = await guardAdmin()
  if (!db) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, contact_name, contact_email, contact_phone, status, participant_count_target, price_per_participant, notes, next_followup } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data, error } = await db
    .from('org_pipeline')
    .insert({
      name: name.trim(),
      contact_name: contact_name ?? null,
      contact_email: contact_email ?? null,
      contact_phone: contact_phone ?? null,
      status: status ?? 'prospect',
      participant_count_target: participant_count_target ?? 0,
      price_per_participant: price_per_participant ?? 40.00,
      notes: notes ?? null,
      next_followup: next_followup ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
