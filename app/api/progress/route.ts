import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const { type, ...payload } = body

  if (type === 'linguu') {
    const { error } = await supabase.from('linguu_progress').insert({
      user_id: user.id,
      topic_id: payload.topic_id,
      lesson_type: payload.lesson_type,
      score: payload.score ?? null,
      xp_earned: payload.xp_earned ?? 0,
      duration_seconds: payload.duration_seconds ?? 0,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'jobmate') {
    const { error } = await supabase.from('jobmate_activity').insert({
      user_id: user.id,
      activity_type: payload.activity_type,
      details: payload.details ?? {},
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'vocab') {
    const { error } = await supabase.from('vocab_mastery').upsert({
      user_id: user.id,
      word_id: payload.word_id,
      mastery_level: payload.mastery_level,
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,word_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
