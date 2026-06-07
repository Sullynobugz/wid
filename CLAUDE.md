# WID — Willkommen in Deutschland

## Status
Aktiv — Live auf wid.techstag.de

## Was diese App ist
B2G SaaS-Plattform für private Maßnahme-Träger (Vereine, Bildungsträger). Integriert Sprachlern-Module, Job-Unterstützung und Einbürgerungsvorbereitung für Einwanderer. Kernwert: automatischer Fortschritts-Nachweis (Eigeninitiative) für Koordinatoren/Jobcenter.

**Erster Kunde**: Privater Verein, 50 Teilnehmer. Pilot Juni kostenlos → ab Juli 40€/Teilnehmer/Monat = 2.000€/Monat recurring.

## Tech Stack
- **Framework**: Next.js 16 (App Router, `proxy.ts` statt `middleware.ts`)
- **Auth + DB**: Supabase
- **Styling**: Tailwind CSS + CSS Variables
- **KI**: Anthropic API (claude-sonnet-4-6) — serverseitig via `/api/claude`
- **Deployment**: Coolify (Hetzner 167.233.30.113) → wid.techstag.de

## ⚠️ Kritisches Auth-Pattern

**IMMER zwei verschiedene Clients verwenden:**

```typescript
// Auth-Check: createClient (anon key, SSR, liest Cookies)
const auth = await createClient()
const { data: { user } } = await auth.auth.getUser()

// DB-Queries: createAdminClient (service role, plain supabase-js, kein SSR)
const db = createAdminClient()
const { data } = await db.from('profiles').select(...)
```

**Niemals** `createServiceClient` (SSR + service role) für `auth.getUser()` nutzen — gibt null zurück → Redirect-Loop.

## Supabase-Setup (bereits erledigt)
- schema.sql ausgeführt ✅
- GRANT auf alle Tabellen für service_role erteilt ✅
- Koordinator-Account angelegt (bastian.sb94@gmail.com) ✅
- Org-ID: `d7a71b81-3726-4854-aa64-29556642055d`
- Supabase-Projekt: `ujeoqxfhpdhhehghumad.supabase.co`

## Architektur
```
app/
├── login/                          # Teilnehmer (Code+PW) + Koordinator (Email+PW)
├── coordinator/                    # Koordinator-Dashboard + Teilnehmer-Verwaltung
│   └── teilnehmer/                 # Teilnehmer anlegen → Credentials-Sheet
├── lernen/                         # Teilnehmer-App: Lernmodule
│   └── [topic]/                    # Phrasen + Vocab + Quiz + Fortschritt-Sync
└── api/
    ├── coordinator/participants/   # Teilnehmer anlegen
    ├── coordinator/reset-password/ # Passwort zurücksetzen
    ├── progress/                   # Fortschritt speichern
    └── claude/                     # Anthropic-Proxy

lib/supabase/client.ts   # Browser-Client (anon)
lib/supabase/server.ts   # Server-Client (anon, SSR) — NUR für auth.getUser()
lib/supabase/admin.ts    # Admin-Client (service role, plain) — für alle DB-Queries
lib/passwords.ts         # generateParticipantCode(), generatePassword(), codeToEmail()
components/coordinator/ParticipantTable.tsx  # Tabelle + Passwort-Reset-Modal
data/content.ts          # 400 Phrasen, 8 Themen (aus Linguu kopiert)
data/words.ts            # 2000 Vokabeln (aus Linguu kopiert)
```

## Was funktioniert (live auf wid.techstag.de)
- ✅ Login (Koordinator + Teilnehmer)
- ✅ Koordinator-Dashboard mit KPI-Cards + Teilnehmer-Tabelle
- ✅ Teilnehmer anlegen (Liste → Credentials-Sheet druckbar)
- ✅ Passwort zurücksetzen (🔑 Button in Tabelle → Modal)
- ✅ Lernmodul-Übersicht (8 Themen, multilingual)
- ✅ Topic-Detail (Phrasen + Vocab + Quiz + XP + Supabase-Sync)
- ✅ /admin Panel (global_admin: bastian.sb94@gmail.com)
- ✅ Passwort-vergessen-Flow (Koordinator-Tab) — Redirect-URL noch nicht in Supabase eingetragen (Backlog)

## Dev-Befehle
```bash
npm run dev -- --port 4000   # Empfohlen: fester Port wegen Browser-Cache
```

## Migrations — alle ausgeführt ✅
- 002_admin_token_assessment.sql ✅
- 003_crossapp_tracking.sql ✅
- 004_pipeline_todos_deep_stats.sql ✅
- 999_set_global_admin.sql ✅ (bastian.sb94@gmail.com = global_admin)

## Global Admin — Recovery
Der einzige Recovery-Pfad ist Supabase Dashboard → SQL Editor → 999_set_global_admin.sql erneut ausführen.
Kein In-App-Recovery nötig. Zugang nur für bastian.sb94@gmail.com + role = 'global_admin'.

## ⚠️ Kein Audio in WID
`app/lernen/[topic]/LessonClient.tsx` hat **kein TTS/Whisper** mehr. Audio-Logik (speak(), Volume2-Icon, Mikrofon-Button) wurde bewusst entfernt — Linguu ist die dedizierte Audio-App. Die OpenAI-Proxies (`/api/openai/tts/` und `/api/openai/whisper/`) wurden gelöscht. Nicht wieder einbauen.

## ⚠️ GuideSection — permanente Anleitung
`components/lernen/GuideSection.tsx` ist eine dauerhaft sichtbare, einklappbare Anleitung auf der Hub-Seite (`app/lernen/page.tsx`). Erklärt den 3-App-Flow (WID → Linguu → JobMate) in allen 9 Sprachen bilingual. Zeigt den WID-Code mit Copy-Button direkt beim Linguu-Schritt. Wird nur gerendert wenn `profile?.participant_code` vorhanden ist.

## Nächste Schritte
1. **Supabase Redirect-URL** — `https://wid.techstag.de/auth/reset-password` unter Authentication → URL Configuration eintragen (Backlog)
2. **E-Mail an Träger** — schriftliche Bestätigung: Juni kostenlos, ab Juli 40€/TN
3. **Ersten Teilnehmer anlegen** — Koordinator-Login testen mit echtem Nutzer

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-06-04 | MVP gebaut: Auth, Coordinator-Dashboard, Teilnehmer-Anlegen, Lernmodule (Phrasen/Vocab/Quiz), alle API-Proxies, Supabase-Schema |
| 2026-06-04 | Debugging: Auth/Admin-Client-Trennung, GRANT-Fix, proxy.ts statt middleware.ts — alles lokal funktionsfähig |
| 2026-06-05 | Global Admin Panel mit Tabs: Übersicht, Pipeline, To-Dos, Organisationen, Assessments, Kosten |
| 2026-06-05 | Deep Stats: MRR, Completion-Rate, Churn, Weekly Activity, Outreach-Pipeline |
| 2026-06-05 | Teilnehmer-View: WID-Code prominent + /lernen/jobs Seite + Sprachauswahl im Nav |
| 2026-06-05 | Cross-App-Tracking: Linguu trackProgress() in Quiz + Lesson, JobMate ApplicationModal |
| 2026-06-07 | Live deployed: wid.techstag.de via Coolify (Hetzner), Webhook aktiv, alle Migrations ausgeführt, global_admin gesetzt, Passwort-vergessen-Flow hinzugefügt |
| 2026-06-07 | Audio aus LessonClient entfernt (gehört zu Linguu, nicht WID). OpenAI-Proxies gelöscht. GuideSection hinzugefügt (permanente 3-App-Anleitung auf Hub-Seite, einklappbar, bilingual) |
