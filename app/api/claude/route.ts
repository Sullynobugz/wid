import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackClaude, makeClaudeTrackingStream } from '@/lib/trackUsage'

export async function POST(req: Request) {
  const body = await req.json()

  // User-ID für Tracking (optional — kein Hard-Fail wenn nicht vorhanden)
  let userId: string | undefined
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    userId = user?.id
  } catch { /* ignorieren */ }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (body.stream) {
    const trackingStream = makeClaudeTrackingStream({
      app: 'wid',
      endpoint: '/api/claude',
      model: body.model ?? 'unknown',
      userId,
    })
    return new Response(upstream.body!.pipeThrough(trackingStream), {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' },
    })
  }

  const data = await upstream.json()
  // Fire-and-forget
  trackClaude({
    app: 'wid',
    endpoint: '/api/claude',
    model: data.model ?? body.model ?? 'unknown',
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    userId,
  })
  return NextResponse.json(data, { status: upstream.status })
}
