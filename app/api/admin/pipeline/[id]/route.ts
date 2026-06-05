import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function guardAdmin() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || user.email !== 'bastian.sb94@gmail.com') return null
  const db = createAdminClient()
  const { data: p } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'global_admin') return null
  return db
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await guardAdmin()
  if (!db) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { name, contact_name, contact_email, contact_phone, status, participant_count_target, price_per_participant, notes, next_followup } = body

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) update.name = name
  if (contact_name !== undefined) update.contact_name = contact_name
  if (contact_email !== undefined) update.contact_email = contact_email
  if (contact_phone !== undefined) update.contact_phone = contact_phone
  if (status !== undefined) update.status = status
  if (participant_count_target !== undefined) update.participant_count_target = participant_count_target
  if (price_per_participant !== undefined) update.price_per_participant = price_per_participant
  if (notes !== undefined) update.notes = notes
  if (next_followup !== undefined) update.next_followup = next_followup

  const { data, error } = await db
    .from('org_pipeline')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await guardAdmin()
  if (!db) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { error } = await db.from('org_pipeline').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
