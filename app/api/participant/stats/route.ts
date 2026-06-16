import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Liefert die aggregierten Hub-Statistiken eines Teilnehmers als JSON.
// Auth über Cookies (createClient), DB-Queries über Service-Role (createAdminClient)
// — striktes WID-Auth-Pattern. Damit kann der Hub clientseitig instant rendern und
// die Zahlen nachladen, statt bei jedem Tab-Wechsel einen Server-Render zu blockieren.

function monthStartIso() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const monthStart = monthStartIso()

  const [{ data: progressRows }, { data: jobmateRows }, { data: assessments }] = await Promise.all([
    db.from('linguu_progress')
      .select('lesson_type, score, xp_earned, completed_at')
      .eq('user_id', user.id),
    db.from('jobmate_activity')
      .select('activity_type, created_at')
      .eq('user_id', user.id),
    db.from('assessment_results')
      .select('level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const progress = progressRows ?? []
  const jobmate = jobmateRows ?? []
  const monthlyProgress = progress.filter(row => row.completed_at >= monthStart)
  const monthlyJobmate = jobmate.filter(row => row.created_at >= monthStart)
  const quizScores = progress
    .filter(row => row.lesson_type === 'quiz' && row.score != null)
    .map(row => row.score as number)
  const avgQuiz = quizScores.length
    ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
    : 0
  const totalXp = progress.reduce((sum, row) => sum + (row.xp_earned ?? 0), 0)

  return Response.json({
    monthlyLinguu: monthlyProgress.length,
    cvUpdates: monthlyJobmate.filter(row => row.activity_type === 'cv_upload').length,
    jobsSaved: monthlyJobmate.filter(row => row.activity_type === 'job_saved').length,
    applications: monthlyJobmate.filter(row => row.activity_type === 'application').length,
    totalProgress: progress.length,
    totalJobmate: jobmate.length,
    totalXp,
    latestLevel: assessments?.[0]?.level ?? 'offen',
    avgQuiz,
  })
}
