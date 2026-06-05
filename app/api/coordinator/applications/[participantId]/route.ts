import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()

  // Sicherstellen dass der Coordinator zur gleichen Org gehört
  const { data: coord } = await db.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!coord || coord.role !== 'coordinator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: participant } = await db.from('profiles').select('organization_id').eq('id', participantId).single()
  if (!participant || participant.organization_id !== coord.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: applications } = await db
    .from('jobmate_activity')
    .select('id, job_title, company, job_url, applied_at, email_proof, verified, created_at')
    .eq('user_id', participantId)
    .eq('activity_type', 'application')
    .order('applied_at', { ascending: false })

  return NextResponse.json({ applications: applications ?? [] })
}

// Koordinator markiert eine Bewerbung als verifiziert
export async function PATCH(req: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params
  const { applicationId, verified } = await req.json()

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: coord } = await db.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!coord || coord.role !== 'coordinator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.from('jobmate_activity')
    .update({ verified })
    .eq('id', applicationId)
    .eq('user_id', participantId)

  return NextResponse.json({ ok: true })
}
