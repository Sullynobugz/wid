import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user || user.email !== 'bastian.sb94@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'global_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const thisMonth = new Date()
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)

  const [
    orgsRes,
    costRes,
    recentAssessmentsRes,
    monthCostRes,
    revenueRes,
    completionRes,
    weeklyRes,
    toplineRes,
    todoStatsRes,
    pipelineRes,
  ] = await Promise.all([
    db.from('admin_org_stats').select('*').order('participant_count', { ascending: false }),
    db.from('admin_cost_by_app').select('*').limit(60),
    db.from('assessment_results')
      .select('*, profiles(full_name, participant_code, organizations(name))')
      .order('completed_at', { ascending: false })
      .limit(20),
    db.from('token_usage').select('cost_eur').gte('created_at', thisMonth.toISOString()),
    db.from('admin_revenue_by_org').select('*').order('mrr_eur', { ascending: false }),
    db.from('admin_completion_stats').select('*'),
    db.from('admin_weekly_activity').select('*').limit(12),
    db.from('admin_topline_kpis').select('*').single(),
    db.from('admin_todos').select('status, priority').neq('status', 'done'),
    db.from('org_pipeline').select('status, name, participant_count_target, price_per_participant').neq('status', 'churned'),
  ])

  const totalCostEurMonth = monthCostRes.data?.reduce((s, r) => s + Number(r.cost_eur), 0) ?? 0

  const pipelineMRR = (pipelineRes.data ?? [])
    .filter(p => p.status === 'signed')
    .reduce((s, p) => s + (p.participant_count_target * Number(p.price_per_participant)), 0)

  return NextResponse.json({
    // Legacy fields (existing admin page)
    orgs: orgsRes.data ?? [],
    costByApp: costRes.data ?? [],
    recentAssessments: recentAssessmentsRes.data ?? [],
    totalCostEurMonth,
    // New deep stats
    revenueByOrg: revenueRes.data ?? [],
    completionStats: completionRes.data ?? [],
    weeklyActivity: weeklyRes.data ?? [],
    topline: toplineRes.data ?? null,
    todoStats: {
      open: (todoStatsRes.data ?? []).filter(t => t.status === 'open').length,
      critical: (todoStatsRes.data ?? []).filter(t => t.priority === 'critical').length,
    },
    pipeline: pipelineRes.data ?? [],
    pipelineMRR,
  })
}
