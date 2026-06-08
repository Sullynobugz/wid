import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Öffentlicher Endpoint für Linguu + JobMate (Auth via participant_code)
// Rate-Limit: kein Shared-Secret nötig — participant_code ist bereits schwer zu erraten
export async function POST(req: Request) {
  const body = await req.json()
  const { participantCode, app, type, data } = body

  if (!participantCode || !app || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = createAdminClient()

  // Teilnehmer via Code auflösen
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, organization_id')
    .eq('participant_code', participantCode)
    .eq('role', 'participant')
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Unknown participant code' }, { status: 404 })
  }

  const userId = profile.id

  // ── Linguu Progress ──────────────────────────────────────────
  if (app === 'linguu' && type === 'progress') {
    const { topicId, lessonType, score, xpEarned, durationSeconds } = data
    await db.from('linguu_progress').insert({
      user_id: userId,
      topic_id: topicId,
      lesson_type: lessonType,
      score: score ?? null,
      xp_earned: xpEarned ?? 0,
      duration_seconds: durationSeconds ?? 0,
    })
    return NextResponse.json({ ok: true })
  }

  // ── Linguu Assessment ────────────────────────────────────────
  if (app === 'linguu' && type === 'assessment') {
    const { sessionId, level, score, total, durationSec, answers } = data
    await db.from('assessment_results').upsert({
      user_id: userId,
      session_id: sessionId ?? `wid_${Date.now()}`,
      level, score, total,
      duration_sec: durationSec ?? 0,
      answers: answers ?? [],
    }, { onConflict: 'user_id,session_id' })
    return NextResponse.json({ ok: true })
  }

  // ── JobMate: Stelle gemerkt ──────────────────────────────────
  if (app === 'jobmate' && type === 'job_saved') {
    const { jobId, jobTitle, company, jobUrl } = data
    await db.from('jobmate_activity').insert({
      user_id: userId,
      activity_type: 'job_saved',
      job_title: jobTitle ?? null,
      company: company ?? null,
      job_url: jobUrl ?? null,
      details: { jobId },
    })
    return NextResponse.json({ ok: true })
  }

  // ── JobMate: Lebenslauf erstellt/überarbeitet ─────────────────
  if (app === 'jobmate' && type === 'cv_upload') {
    const { filename, action } = data
    await db.from('jobmate_activity').insert({
      user_id: userId,
      activity_type: 'cv_upload',
      details: {
        filename: filename ?? null,
        action: action ?? 'updated',
      },
    })
    return NextResponse.json({ ok: true })
  }

  // ── JobMate: Bewerbung ────────────────────────────────────────
  if (app === 'jobmate' && type === 'application') {
    const { jobId, jobTitle, company, jobUrl, emailProof, appliedAt } = data
    await db.from('jobmate_activity').insert({
      user_id: userId,
      activity_type: 'application',
      job_title: jobTitle ?? null,
      company: company ?? null,
      job_url: jobUrl ?? null,
      email_proof: emailProof ?? null,
      applied_at: appliedAt ?? new Date().toISOString(),
      details: { jobId },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
