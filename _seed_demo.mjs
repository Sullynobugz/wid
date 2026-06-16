// TEMP (löschbar) — befüllt Demo-Teilnehmer WID-DEMO1 (Max Mustermann) mit realistischen
// Anwesenheits-, Bewerbungs-, Einbürgerungs- und Vormonats-Daten für die Demo.
// Idempotent: löscht nur eigene Seed-Marker, lässt Maxs echte Daten unberührt.
// VORAUSSETZUNG: Migration 008_attendance.sql ist eingespielt.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const ENV = '/Users/sully/projects/wid/.env.local'
const txt = readFileSync(ENV, 'utf8')
const pick = (k) => {
  const m = txt.match(new RegExp('^' + k + '\\s*=\\s*(.*)$', 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''
}
const db = createClient(pick('NEXT_PUBLIC_SUPABASE_URL'), pick('SUPABASE_SERVICE_ROLE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } })

const { data: p, error: pErr } = await db
  .from('profiles').select('id, organization_id, full_name')
  .eq('participant_code', 'WID-DEMO1').single()
if (pErr || !p) { console.error('WID-DEMO1 nicht gefunden:', pErr?.message); process.exit(1) }
const uid = p.id, org = p.organization_id
console.log(`Seed für ${p.full_name} (${uid})`)

const iso = (d) => d.toISOString()
const atTime = (date, h, m) => { const d = new Date(date); d.setHours(h, m, 0, 0); return d }

// ── 1. ANWESENHEIT — letzte ~20 Werktage ──────────────────────
await db.from('attendance').delete().eq('user_id', uid)
const att = []
let day = new Date(); day.setHours(0, 0, 0, 0)
let added = 0
const lateDays = new Set([3, 9, 14]) // welche der Werktage verspätet
while (added < 20) {
  day.setDate(day.getDate() - 1)
  const dow = day.getDay()
  if (dow === 0 || dow === 6) continue // Wochenende überspringen
  const late = lateDays.has(added)
  const inH = late ? 9 : 8
  const inM = late ? 8 + Math.floor(Math.random() * 14) : 46 + Math.floor(Math.random() * 12)
  const checkIn = atTime(day, inH, Math.min(inM, 59))
  const checkOut = atTime(day, 13, 45 + Math.floor(Math.random() * 25))
  att.push({
    user_id: uid, organization_id: org,
    date: day.toISOString().slice(0, 10),
    check_in: iso(checkIn), check_out: iso(checkOut),
    was_late: late,
  })
  added++
}
const { error: aErr } = await db.from('attendance').insert(att)
console.log(aErr ? `  Anwesenheit FEHLER: ${aErr.message}` : `  ✓ ${att.length} Anwesenheitstage (${[...lateDays].length} verspätet)`)

// Heutiger Stempel für Max
const todayStr = new Date().toISOString().slice(0, 10)
const todayMs = new Date(todayStr).getTime()
const todayCI = new Date(todayMs); todayCI.setHours(8, 47, 0, 0)
await db.from('attendance').upsert(
  { user_id: uid, organization_id: org, date: todayStr, check_in: todayCI.toISOString(), was_late: false },
  { onConflict: 'user_id,date' }
)
console.log(`  ✓ Heutiger Stempel 08:47`)

// ── 2. BEWERBUNGEN mit Ergebnis-Status ────────────────────────
await db.from('jobmate_activity').delete().eq('user_id', uid).eq('job_url', 'seed://demo')
const jobs = [
  { t: 'Lagermitarbeiter (m/w/d)', c: 'DHL Hub Oldenburg', o: 'offer' },
  { t: 'Küchenhilfe', c: 'Mensa Universität', o: 'invited' },
  { t: 'Produktionshelfer', c: 'Broetje Automation', o: 'applied' },
  { t: 'Reinigungskraft', c: 'GebäudeService Nord', o: 'applied' },
  { t: 'Kommissionierer', c: 'Famila Logistik', o: 'rejected' },
  { t: 'Helfer Garten- und Landschaftsbau', c: 'GaLaBau Meyer', o: 'applied' },
]
const apps = jobs.map((j, i) => ({
  user_id: uid, activity_type: 'application',
  job_title: j.t, company: j.c, job_url: 'seed://demo',
  outcome: j.o, applied_at: iso(atTime(new Date(Date.now() - (i + 2) * 86400000), 11, 0)),
  verified: j.o !== 'applied',
}))
// ein paar Favoriten (gemerkte Stellen)
const favs = Array.from({ length: 9 }, (_, i) => ({
  user_id: uid, activity_type: 'job_saved',
  job_title: `Gemerkte Stelle ${i + 1}`, company: 'Diverse', job_url: 'seed://demo',
  created_at: iso(atTime(new Date(Date.now() - (i + 1) * 86400000), 10, 0)),
}))
const { error: jErr } = await db.from('jobmate_activity').insert([...apps, ...favs])
console.log(jErr ? `  Bewerbungen FEHLER: ${jErr.message}` : `  ✓ ${apps.length} Bewerbungen (mit Ergebnis) + ${favs.length} Favoriten`)

// ── 3. EINBÜRGERUNGSTEST-Training (Marker eb_demo_) ───────────
await db.from('assessment_results').delete().eq('user_id', uid).like('session_id', 'eb_demo_%')
const eb = [
  { score: 22, total: 33, dur: 740 },
  { score: 25, total: 33, dur: 690 },
  { score: 28, total: 33, dur: 810 },
  { score: 29, total: 33, dur: 600 },
  { score: 31, total: 33, dur: 720 },
]
const ebRows = eb.map((e, i) => ({
  user_id: uid, session_id: `eb_demo_${i}`, level: 'Einbürgerung',
  score: e.score, total: e.total, duration_sec: e.dur, answers: [],
  created_at: iso(atTime(new Date(Date.now() - (i + 1) * 2 * 86400000), 12, 0)),
}))
const { error: eErr } = await db.from('assessment_results').insert(ebRows)
console.log(eErr ? `  Einbürgerung FEHLER: ${eErr.message}` : `  ✓ ${ebRows.length} Einbürgerungs-Durchläufe`)

// ── 4. LINGUU — Vormonat + aktueller Monat (für Delta) ────────
await db.from('linguu_progress').delete().eq('user_id', uid).in('topic_id', ['seed_prevmonth', 'seed_thismonth'])
const mkLesson = (topic, when, quiz, score) => ({
  user_id: uid, topic_id: topic,
  lesson_type: quiz ? 'quiz' : 'lesson',
  score: quiz ? score : null, xp_earned: 50,
  duration_seconds: 300 + Math.floor(Math.random() * 240),
  completed_at: iso(when),
})
const now = new Date()
const thisMonthBase = new Date(now.getFullYear(), now.getMonth(), 2, 10, 0)
const prevMonthBase = new Date(now.getFullYear(), now.getMonth() - 1, 10, 10, 0)
const linguu = []
for (let i = 0; i < 11; i++) linguu.push(mkLesson('seed_thismonth', new Date(thisMonthBase.getTime() + i * 6 * 3600000), i % 2 === 0, 78 + (i % 5) * 4))
for (let i = 0; i < 6; i++)  linguu.push(mkLesson('seed_prevmonth', new Date(prevMonthBase.getTime() + i * 24 * 3600000), i % 2 === 0, 70 + i * 3))
const { error: lErr } = await db.from('linguu_progress').insert(linguu)
console.log(lErr ? `  Linguu FEHLER: ${lErr.message}` : `  ✓ 11 Lektionen (Monat) + 6 (Vormonat) → positives Delta`)

console.log('\nFertig. Dossier öffnen: /coordinator → Max Mustermann → Dossier-Icon')
