# WID — Willkommen in Deutschland

## Status
Aktiv — Pilot-Phase

## Was diese App ist
B2G SaaS-Plattform für private Maßnahme-Träger (Vereine, Bildungsträger). Integriert Sprachlern-Module, Job-Unterstützung und Einbürgerungsvorbereitung für Einwanderer. Kernwert: automatischer Fortschritts-Nachweis (Eigeninitiative) für Koordinatoren/Jobcenter.

**Erster Kunde**: Privater Verein, 50 Teilnehmer. Pilot Juni kostenlos → ab Juli 40€/Teilnehmer/Monat = 2.000€/Monat recurring.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth + DB**: Supabase
- **Styling**: Tailwind CSS + CSS Variables
- **KI**: Anthropic API (claude-sonnet-4-6) — serverseitig via `/api/claude`
- **Audio**: OpenAI TTS + Whisper — serverseitig via `/api/openai/`
- **Deployment**: Coolify (Hetzner 167.233.30.113) → wid.techstag.de

## Architektur
```
app/
├── login/              # Teilnehmer (Code+PW) + Koordinator (Email+PW)
├── coordinator/        # Koordinator-Dashboard + Teilnehmer-Verwaltung
│   └── teilnehmer/     # Teilnehmer anlegen (Liste → Credentials-Sheet)
├── lernen/             # Teilnehmer-App: Lernmodule
│   └── [topic]/        # Einzelne Lektionen (Phrasen, Vocab, Quiz)
└── api/
    ├── coordinator/participants/  # Teilnehmer anlegen (Service Role)
    ├── progress/                  # Fortschritt speichern
    ├── claude/                    # Anthropic-Proxy
    └── openai/{tts,whisper}/      # OpenAI-Proxies

lib/supabase/{client,server}.ts
lib/passwords.ts    # generateParticipantCode(), generatePassword(), codeToEmail()
types/index.ts
supabase/schema.sql
```

## Accounts-System
- Teilnehmer bekommen Code `WID-XXXXX` + Passwort `Mond-1234` (kein E-Mail nötig)
- Koordinator lädt Namensliste hoch → System erzeugt Accounts → druckbares Credentials-Sheet
- Supabase-intern: fake Email `wid-xxxxx@wid.internal`

## Dev-Befehle
```bash
npm run dev   # http://localhost:3000
```

## Nächste Schritte
1. **Supabase-Projekt anlegen** — schema.sql ausführen, ENV-Keys in .env.local
2. **Koordinator-Account manuell anlegen** — via Supabase Dashboard (Auth + profiles mit role='coordinator')
3. **Linguu-Content kopieren** — `cp ~/projects/linguu/src/data/content.ts data/content.ts && cp ~/projects/linguu/src/data/words.ts data/words.ts`
4. **Topic-Detail-Seite bauen** — `app/lernen/[topic]/page.tsx` mit Phrasen + Quiz + Fortschritt-Sync
5. **Coolify-Deploy** — GitHub-Push + neue Resource auf Coolify, wid.techstag.de

## Entwicklungslog
| Datum | Was & Warum |
|-------|-------------|
| 2026-06-04 | Projektstart — WID als B2G-Spin-off aus Linguu. Auth, Coordinator-Dashboard, Teilnehmer-Anlegen, Lern-Modul-Übersicht, alle API-Proxies + Progress-Tracking gebaut. |
