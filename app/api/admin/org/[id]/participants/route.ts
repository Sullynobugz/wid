import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'global_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: participants } = await db
    .from('participant_stats')
    .select('*')
    .eq('organization_id', orgId)
    .order('last_active', { ascending: false, nullsFirst: false })

  return NextResponse.json({ participants: participants ?? [] })
}
