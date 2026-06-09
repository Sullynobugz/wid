import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File | null
  const lang = (formData.get('lang') as string) || 'de'
  if (!audio) return new Response('Missing audio', { status: 400 })

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: 'whisper-1',
    language: lang === 'ku' ? undefined : lang,
  })

  return Response.json({ text: transcription.text })
}
