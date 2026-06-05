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
  const { status, title, description, priority, category, due_date } = body

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) update.status = status
  if (title !== undefined) update.title = title
  if (description !== undefined) update.description = description
  if (priority !== undefined) update.priority = priority
  if (category !== undefined) update.category = category
  if (due_date !== undefined) update.due_date = due_date

  const { data, error } = await db
    .from('admin_todos')
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
  const { error } = await db.from('admin_todos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
