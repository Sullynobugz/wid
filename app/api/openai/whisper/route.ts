import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackWhisper } from '@/lib/trackUsage'

export async function POST(req: Request) {
  const formData = await req.formData()

  let userId: string | undefined
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    userId = user?.id
  } catch { /* ignorieren */ }

  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  })

  const data = await upstream.json()

  // duration wird vom Client als Header mitgeschickt (optional)
  const durationSec = parseFloat(req.headers.get('x-audio-duration') ?? '0')
  if (durationSec > 0) {
    trackWhisper({ app: 'wid', durationSec, userId })
  }

  return NextResponse.json(data, { status: upstream.status })
}
