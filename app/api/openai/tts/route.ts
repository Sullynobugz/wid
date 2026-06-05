import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackTts } from '@/lib/trackUsage'

export async function POST(req: Request) {
  const body = await req.json()

  let userId: string | undefined
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    userId = user?.id
  } catch { /* ignorieren */ }

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!upstream.ok) {
    return NextResponse.json({ error: 'TTS error' }, { status: upstream.status })
  }

  trackTts({ app: 'wid', chars: (body.input as string)?.length ?? 0, userId })

  return new Response(upstream.body, {
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'audio/mpeg' },
  })
}
