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
    .from('admin_todos')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const db = await guardAdmin()
  if (!db) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, description, priority, category, due_date } = body
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const { data, error } = await db
    .from('admin_todos')
    .insert({ title: title.trim(), description, priority: priority ?? 'medium', category: category ?? 'general', due_date: due_date ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
