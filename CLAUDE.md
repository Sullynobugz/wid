# WID — Willkommen in Deutschland

## Status
Aktiv — Pilot-Phase (lokal getestet, funktioniert)

## Was diese App ist
B2G SaaS-Plattform für private Maßnahme-Träger (Vereine, Bildungsträger). Integriert Sprachlern-Module, Job-Unterstützung und Einbürgerungsvorbereitung für Einwanderer. Kernwert: automatischer Fortschritts-Nachweis (Eigeninitiative) für Koordinatoren/Jobcenter.

**Erster Kunde**: Privater Verein, 50 Teilnehmer. Pilot Juni kostenlos → ab Juli 40€/Teilnehmer/Monat = 2.000€/Monat recurring.

## Tech Stack
- **Framework**: Next.js 16 (App Router, `proxy.ts` statt `middleware.ts`)
- **Auth + DB**: Supabase
- **Styling**: Tailwind CSS + CSS Variables
- **KI**: Anthropic API (claude-sonnet-4-6) — serverseitig via `/api/claude`
- **Audio**: OpenAI TTS + Whisper — serverseitig via `/api/openai/`
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
    ├── claude/                     # Anthropic-Proxy
    └── openai/{tts,whisper}/       # OpenAI-Proxies

lib/supabase/client.ts   # Browser-Client (anon)
lib/supabase/server.ts   # Server-Client (anon, SSR) — NUR für auth.getUser()
lib/supabase/admin.ts    # Admin-Client (service role, plain) — für alle DB-Queries
lib/passwords.ts         # generateParticipantCode(), generatePassword(), codeToEmail()
components/coordinator/ParticipantTable.tsx  # Tabelle + Passwort-Reset-Modal
data/content.ts          # 400 Phrasen, 8 Themen (aus Linguu kopiert)
data/words.ts            # 2000 Vokabeln (aus Linguu kopiert)
```

## Was funktioniert (lokal getestet)
- ✅ Login (Koordinator + Teilnehmer)
- ✅ Koordinator-Dashboard mit KPI-Cards + Teilnehmer-Tabelle
- ✅ Teilnehmer anlegen (Liste → Credentials-Sheet druckbar)
- ✅ Passwort zurücksetzen (🔑 Button in Tabelle → Modal)
- ✅ Lernmodul-Übersicht (8 Themen, multilingual)
- ✅ Topic-Detail (Phrasen + Vocab + Quiz + XP + Supabase-Sync)

## Dev-Befehle
```bash
npm run dev -- --port 4000   # Empfohlen: fester Port wegen Browser-Cache
```

## Nächste Schritte
1. **Coolify-Deploy** — GitHub-Push + neue Resource → wid.techstag.de
2. **E-Mail an Träger** — schriftliche Bestätigung: Juni kostenlos, ab Juli 40€/TN
3. **Participant-Login testen** — Incognito-Tab, Code + PW aus Credentials-Sheet
4. **Whisper/TTS in Produktion testen** — API-Keys laufen, braucht echten Browser-Test

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-06-04 | MVP gebaut: Auth, Coordinator-Dashboard, Teilnehmer-Anlegen, Lernmodule (Phrasen/Vocab/Quiz), alle API-Proxies, Supabase-Schema |
| 2026-06-04 | Debugging: Auth/Admin-Client-Trennung, GRANT-Fix, proxy.ts statt middleware.ts — alles lokal funktionsfähig |
