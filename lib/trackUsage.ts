import { createAdminClient } from './supabase/admin'

// Kosten in EUR (USD × 0.92)
const EUR_PER_INPUT_TOK  = (3  / 1_000_000) * 0.92   // claude-sonnet input
const EUR_PER_OUTPUT_TOK = (15 / 1_000_000) * 0.92   // claude-sonnet output
const EUR_PER_TTS_CHAR   = 0.000015 * 0.92
const EUR_PER_WHISPER_SEC = (0.006 / 60) * 0.92

type App = 'linguu' | 'jobmate' | 'wid'

export async function trackClaude(opts: {
  app: App
  endpoint: string
  model: string
  inputTokens: number
  outputTokens: number
  userId?: string
}) {
  try {
    const db = createAdminClient()
    await db.from('token_usage').insert({
      user_id: opts.userId ?? null,
      app: opts.app,
      endpoint: opts.endpoint,
      model: opts.model,
      input_tokens: opts.inputTokens,
      output_tokens: opts.outputTokens,
      cost_eur: opts.inputTokens * EUR_PER_INPUT_TOK + opts.outputTokens * EUR_PER_OUTPUT_TOK,
    })
  } catch (err) {
    console.error('[trackUsage] claude:', err)
  }
}

export async function trackTts(opts: { app: App; chars: number; userId?: string }) {
  try {
    const db = createAdminClient()
    await db.from('token_usage').insert({
      user_id: opts.userId ?? null,
      app: opts.app,
      endpoint: 'tts',
      model: 'tts-1',
      tts_chars: opts.chars,
      cost_eur: opts.chars * EUR_PER_TTS_CHAR,
    })
  } catch (err) {
    console.error('[trackUsage] tts:', err)
  }
}

export async function trackWhisper(opts: { app: App; durationSec: number; userId?: string }) {
  try {
    const db = createAdminClient()
    await db.from('token_usage').insert({
      user_id: opts.userId ?? null,
      app: opts.app,
      endpoint: 'whisper',
      model: 'whisper-1',
      whisper_secs: opts.durationSec,
      cost_eur: opts.durationSec * EUR_PER_WHISPER_SEC,
    })
  } catch (err) {
    console.error('[trackUsage] whisper:', err)
  }
}

// TransformStream der SSE-Events beobachtet und Token-Usage extrahiert
export function makeClaudeTrackingStream(opts: {
  app: App
  endpoint: string
  model: string
  userId?: string
}): TransformStream<Uint8Array, Uint8Array> {
  let inputTokens = 0
  let outputTokens = 0
  const decoder = new TextDecoder()
  let buffer = ''

  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk)
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'message_start' && ev.message?.usage) {
            inputTokens = ev.message.usage.input_tokens
          }
          if (ev.type === 'message_delta' && ev.usage) {
            outputTokens = ev.usage.output_tokens
          }
        } catch { /* SSE-Parse-Fehler ignorieren */ }
      }
    },
    async flush() {
      if (inputTokens > 0 || outputTokens > 0) {
        await trackClaude({ ...opts, inputTokens, outputTokens })
      }
    },
  })
}
