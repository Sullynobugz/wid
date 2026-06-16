// TEMP (löschbar) — legt 4 Mock-Teilnehmer (DEMO-A..D) in Pilotverein an mit
// unterschiedlichem Fortschritt + Pünktlichkeit, für die Maßnahmen-Statistik.
// Idempotent: löscht vorhandene DEMO-* Teilnehmer samt Daten und legt neu an.
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

const DAY = 86400000
const iso = (ms) => new Date(ms).toISOString()
const atHM = (ms, h, m) => { const d = new Date(ms); d.setHours(h, m, 0, 0); return d.getTime() }

const { data: orgs } = await db.from('organizations').select('id, name')
const pilot = orgs?.find(o => o.name === 'Pilotverein')
if (!pilot) { console.error('Pilotverein nicht gefunden'); process.exit(1) }

// ── Bestehende DEMO-* Teilnehmer + Daten löschen ──────────────
const { data: existing } = await db.from('profiles').select('id').like('participant_code', 'DEMO-%')
const ids = (existing ?? []).map(r => r.id)
if (ids.length) {
  for (const tbl of ['attendance', 'jobmate_activity', 'linguu_progress', 'assessment_results']) {
    await db.from(tbl).delete().in('user_id', ids)
  }
  await db.from('profiles').delete().in('id', ids)
  for (const id of ids) await db.auth.admin.deleteUser(id).catch(() => {})
  console.log(`Alte Mock-Teilnehmer entfernt: ${ids.length}`)
}

// fortschritt: lessons (Monat), lessonsPrev (Vormonat), punctual (Anteil pünktlich),
// apps (Bewerbungen), firstAppDay (Tage nach Eintritt bis 1. Bewerbung), eb (Einbürgerungs-Läufe),
// activeDaysAgo (letzte Aktivität vor X Tagen → steuert "aktiv")
const PEOPLE = [
  { code: 'DEMO-A', name: 'Amara Okafor',    lang: 'en', enter: 46, lessons: 24, lessonsPrev: 14, punctual: 1.0,  apps: 5, firstAppDay: 8,  eb: 5, activeDaysAgo: 1 },
  { code: 'DEMO-B', name: 'Mehmet Yıldız',   lang: 'tr', enter: 40, lessons: 15, lessonsPrev: 11, punctual: 0.8,  apps: 3, firstAppDay: 19, eb: 3, activeDaysAgo: 2 },
  { code: 'DEMO-C', name: 'Olena Kovalenko', lang: 'uk', enter: 52, lessons: 31, lessonsPrev: 20, punctual: 0.9,  apps: 1, firstAppDay: 34, eb: 6, activeDaysAgo: 3 },
  { code: 'DEMO-D', name: 'Samir Haddad',    lang: 'ar', enter: 38, lessons: 6,  lessonsPrev: 7,  punctual: 0.55, apps: 0, firstAppDay: null, eb: 1, activeDaysAgo: 20 },
]
const OUTCOMES = ['offer', 'invited', 'applied', 'rejected', 'applied']

for (const P of PEOPLE) {
  const email = `${P.code.toLowerCase()}@wid.internal`
  const { data: au, error: aErr } = await db.auth.admin.createUser({ email, password: 'demo1234', email_confirm: true })
  if (aErr || !au.user) { console.error(`  ${P.code} auth FEHLER:`, aErr?.message); continue }
  const uid = au.user.id
  const entryMs = Date.now() - P.enter * DAY

  await db.from('profiles').insert({
    id: uid, organization_id: pilot.id, full_name: P.name,
    participant_code: P.code, role: 'participant', native_language: P.lang,
    created_at: iso(entryMs),
  })

  // Anwesenheit — letzte min(enter, 18) Werktage, Anteil verspätet aus punctual
  const targetDays = Math.min(P.enter, 18)
  const lateTotal = Math.round(targetDays * (1 - P.punctual))
  const att = []; let d = new Date(); d.setHours(0, 0, 0, 0); let n = 0
  while (n < targetDays) {
    d.setDate(d.getDate() - 1)
    const dow = d.getDay(); if (dow === 0 || dow === 6) continue
    const late = n < lateTotal
    const ci = atHM(d.getTime(), late ? 9 : 8, late ? 6 + (n % 18) : 47 + (n % 11))
    const co = atHM(d.getTime(), 13, 50 + (n % 20))
    att.push({ user_id: uid, organization_id: pilot.id, date: new Date(d).toISOString().slice(0, 10), check_in: iso(ci), check_out: iso(co), was_late: late })
    n++
  }
  await db.from('attendance').insert(att)

  // Heutiger Stempel — nur aktive Teilnehmer (nicht DEMO-D)
  if (P.activeDaysAgo <= 5) {
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayMs = new Date(todayStr).getTime()
    const late = P.punctual < 0.8
    const ci = atHM(todayMs, late ? 9 : 8, late ? 12 : 52)
    await db.from('attendance').upsert(
      { user_id: uid, organization_id: pilot.id, date: todayStr, check_in: iso(ci), was_late: late },
      { onConflict: 'user_id,date' }
    )
  }

  // Bewerbungen — erste bei entry+firstAppDay, weitere alle ~5 Tage danach, mit Ergebnis
  if (P.apps > 0 && P.firstAppDay != null) {
    const apps = Array.from({ length: P.apps }, (_, i) => {
      const t = entryMs + (P.firstAppDay + i * 5) * DAY
      return { user_id: uid, activity_type: 'application', job_title: `Stelle ${i + 1}`, company: 'Demo GmbH', job_url: 'seed://demo', outcome: OUTCOMES[i % OUTCOMES.length], applied_at: iso(Math.min(t, Date.now() - DAY)), verified: i % 2 === 0 }
    })
    const favs = Array.from({ length: Math.max(2, P.apps + 2) }, (_, i) => ({ user_id: uid, activity_type: 'job_saved', job_title: `Gemerkt ${i + 1}`, company: 'Diverse', job_url: 'seed://demo', created_at: iso(entryMs + (i + 1) * 3 * DAY) }))
    await db.from('jobmate_activity').insert([...apps, ...favs])
  }

  // Linguu — aktueller Monat (letzte Aktivität via activeDaysAgo) + Vormonat
  const lessons = []
  const lastActive = Date.now() - P.activeDaysAgo * DAY
  for (let i = 0; i < P.lessons; i++) lessons.push({ user_id: uid, topic_id: 'seed_thismonth', lesson_type: i % 2 ? 'quiz' : 'lesson', score: i % 2 ? 72 + (i % 6) * 4 : null, xp_earned: 50, duration_seconds: 300 + (i % 5) * 60, completed_at: iso(lastActive - i * 0.4 * DAY) })
  const prevBase = new Date(); prevBase.setMonth(prevBase.getMonth() - 1, 10)
  for (let i = 0; i < P.lessonsPrev; i++) lessons.push({ user_id: uid, topic_id: 'seed_prevmonth', lesson_type: i % 2 ? 'quiz' : 'lesson', score: i % 2 ? 68 + i * 2 : null, xp_earned: 50, duration_seconds: 300, completed_at: iso(prevBase.getTime() + i * DAY) })
  await db.from('linguu_progress').insert(lessons)

  // Einbürgerung
  if (P.eb > 0) {
    const eb = Array.from({ length: P.eb }, (_, i) => ({ user_id: uid, session_id: `eb_demo_${P.code}_${i}`, level: 'Einbürgerung', score: 20 + i * 2, total: 33, duration_sec: 600 + i * 90, answers: [], created_at: iso(Date.now() - (i + 1) * 3 * DAY) }))
    await db.from('assessment_results').insert(eb)
  }

  console.log(`  ✓ ${P.name} (${P.code}) — ${P.lessons} Lekt., ${P.apps} Bew., Pünktl. ${Math.round(P.punctual * 100)}%`)
}

console.log('\nFertig. 4 Mock-Teilnehmer in Pilotverein. Login je: Code oben / demo1234')
