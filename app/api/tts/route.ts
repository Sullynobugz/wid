import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  const { text, voice = 'nova' } = await req.json()
  if (!text) return new Response('Missing text', { status: 400 })

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    input: text,
    voice,
    speed: 1.0,
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  return new Response(buffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
