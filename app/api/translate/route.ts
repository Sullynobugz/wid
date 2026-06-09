import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const LANG_NAMES: Record<string, string> = {
  de: 'German', ar: 'Arabic', uk: 'Ukrainian', es: 'Spanish',
  en: 'English', tr: 'Turkish', pl: 'Polish', ro: 'Romanian',
  ru: 'Russian', ku: 'Kurdish (Kurmanji)',
}

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { text, from, to } = await req.json()
  if (!text || !from || !to) return new Response('Missing params', { status: 400 })

  const fromName = LANG_NAMES[from] ?? from
  const toName = LANG_NAMES[to] ?? to

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are a professional interpreter. Translate the user's text from ${fromName} to ${toName}. Output ONLY the translation — no explanations, no quotes, no additional text.`,
    messages: [{ role: 'user', content: text }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
