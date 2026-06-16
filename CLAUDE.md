# WID — Willkommen in Deutschland

## Status
Aktiv — Live auf wid.techstag.de

## Was diese App ist
B2G SaaS-Plattform für private Maßnahme-Träger (Vereine, Bildungsträger). WID ist die zentrale Schaltzentrale für Teilnehmer, Koordinatoren und Global Admins. Linguu liefert Sprachlern-Fortschritt, JobMate liefert CV-/Job-/Bewerbungsaktivität, WID konsolidiert beides zu Fortschrittsübersichten und One-Click-Reporting.

**Erster Kunde**: Privater Verein, 50 Teilnehmer. Pilot Juni kostenlos → ab Juli 40€/Teilnehmer/Monat = 2.000€/Monat recurring.

## Tech Stack
- **Framework**: Next.js 16 (App Router, `proxy.ts` statt `middleware.ts`)
- **Auth + DB**: Supabase
- **Styling**: Tailwind CSS + CSS Variables
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
├── lernen/                         # Teilnehmer-Hub: Fortschritt + App-Links + Einbürgerung
│   └── einbuergerung/              # Interaktiver Test-Trainer (33 Fragen, Bundesland-Filter)
└── api/
    ├── coordinator/participants/   # Teilnehmer anlegen
    ├── coordinator/reset-password/ # Passwort zurücksetzen
    └── participant/track/          # Cross-App-Tracking von Linguu/JobMate

lib/supabase/client.ts   # Browser-Client (anon)
lib/supabase/server.ts   # Server-Client (anon, SSR) — NUR für auth.getUser()
lib/supabase/admin.ts    # Admin-Client (service role, plain) — für alle DB-Queries
lib/passwords.ts         # generateParticipantCode(), generatePassword(), codeToEmail()
components/coordinator/ParticipantTable.tsx  # Tabelle + Passwort-Reset-Modal
components/lernen/FloatingTranslator.tsx     # Simultanübersetzer (überall im Lernbereich)
data/einbuergerung/questions.json           # 460 BAMF-Fragen (offizieller Fragenkatalog)
```

## Was funktioniert (live auf wid.techstag.de)
- ✅ Login (Koordinator + Teilnehmer)
- ✅ Koordinator-Dashboard mit KPI-Cards + Teilnehmer-Tabelle
- ✅ Teilnehmer anlegen (Liste → Credentials-Sheet druckbar)
- ✅ Passwort zurücksetzen (🔑 Button in Tabelle → Modal)
- ✅ Teilnehmer-Hub mit eigenem Fortschritt aus Linguu und JobMate
- ✅ Einbürgerungstest-Trainer (460 BAMF-Fragen, 33er-Simulation, Bundesland-Filter, Ergebnis-Screen)
- ✅ One-Click-Reporting für Koordinatoren
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

## ⚠️ WID bleibt Hub, kein Linguu-Klon
WID enthält keine internen Sprachlektionen, kein Phrasen-/Vokabeltraining und keine Audio-/KI-Proxies. Lernen passiert in Linguu, Jobs/CV/Bewerbungen passieren in JobMate. WID zeigt Teilnehmern den eigenen Fortschritt, Koordinatoren den Fortschritt aller Teilnehmer und Global Admins die Gesamtansicht.

## ⚠️ GuideSection — permanente Anleitung
`components/lernen/GuideSection.tsx` ist eine dauerhaft sichtbare, einklappbare Anleitung auf der Hub-Seite (`app/lernen/page.tsx`). Erklärt den 3-App-Flow (WID → Linguu → JobMate) in allen 9 Sprachen bilingual. Zeigt den WID-Code mit Copy-Button direkt beim Linguu-Schritt. Wird nur gerendert wenn `profile?.participant_code` vorhanden ist.

## 🤖 Fable-5-Task — 3-App-Plattform Sprint

> Dieser Block ist für eine Claude Fable 5 Session vorbereitet.
> Session starten mit: `cd ~/projects/wid && claude --add-dir ~/projects/linguu --add-dir ~/projects/jobmate`
> **Lies zuerst alle drei CLAUDE.md-Dateien vollständig, dann starte mit Phase 1.**

### Kontext: Die 3-App-Plattform

Drei Apps, ein Ökosystem — alle live auf Hetzner via Coolify:
- **WID** (`wid.techstag.de`) — Hub: Auth, Koordinator-Dashboard, Teilnehmer-Verwaltung, Fortschrittsreporting. Einzige App mit Backend (Supabase).
- **Linguu** (`linguu.techstag.de`) — Deutsch lernen (8 Themen, ~400 Phrasen, 2000 Vokabeln, Whisper-Aussprache). Kein Backend — localStorage.
- **JobMate** (`jobmate.techstag.de`) — CV verbessern, Jobs suchen, Bewerbungen tracken. Kein Backend — localStorage.

**Geschäftskontext**: Erster Kunde (privater Verein, ~50 Teilnehmer). Pilot Juni kostenlos → ab Juli 40€/Teilnehmer/Monat = **2.000€/Monat recurring**. Qualität und Zuverlässigkeit der Integration sind umsatzrelevant.

**Cross-App-Tracking** läuft bereits: `widTracking.ts` in Linguu und JobMate meldet Aktivität an `/api/participant/track` in WID. Der WID-Code muss aber noch manuell eingegeben werden — das ist die größte UX-Lücke.

---

### Phase 1 — URL-Param-Handoff (höchste Priorität)

Das ist die kritischste offene Integration. Heute müssen Teilnehmer ihren WID-Code in Linguu und JobMate manuell eintippen. Das soll wegfallen.

**Ziel**: WID generiert Links zu Linguu/JobMate mit dem WID-Code als URL-Parameter. Linguu/JobMate lesen den Parameter beim ersten Besuch und speichern ihn in localStorage — Teilnehmer kommen an und ihr Code ist bereits gesetzt.

**Konkret:**

1. **WID — Link-Generierung** (`app/lernen/page.tsx` und `components/lernen/GuideSection.tsx`): Buttons/Links zu Linguu und JobMate um `?wid=<participant_code>` erweitern. `participant_code` liegt im Profil vor (`profile?.participant_code`).

2. **Linguu — Code empfangen** (`src/lib/widTracking.ts` + Onboarding): Beim App-Start URL-Param `?wid=` auslesen. Falls vorhanden → in localStorage unter dem bestehenden Key für den WID-Code speichern und `widTracking` initialisieren. Kein Onboarding-Schritt nötig, passiert im Hintergrund.

3. **JobMate — Code empfangen** (analog zu Linguu): `?wid=`-Param beim Start in `store/appStore.ts` oder einem Initialisierungs-Hook auslesen und persistieren. Alle nachfolgenden Tracking-Calls nutzen ihn automatisch.

4. Testen: Simuliere den kompletten Flow — WID-Teilnehmer-Hub → Link klicken → Linguu öffnet mit Code vorausgefüllt → Aktivität wird in WID sichtbar.

---

### Phase 2 — Linguu Features (`~/projects/linguu`)

5. **Quiz: Audio nach falscher Antwort** — nach einer falschen Antwort die korrekte Übersetzung in der Muttersprache vorlesen. `AudioControls`-Komponente unterstützt das bereits (TTS-Proxy unter `/api/openai/tts` ist aktiv). Sprache kommt aus dem Onboarding-State (Muttersprache des Nutzers).

6. **Sprechen-Flow prominenter** — Whisper/Mikrofon ist der stärkste USP, aber UI-technisch noch nicht sichtbar genug. Im Lektions-Bereich den Aufnahme-Button größer und erklärender gestalten. Kurzer Onboarding-Hinweis beim ersten Mal: "Sprich nach — wir überprüfen deine Aussprache."

---

### Phase 3 — JobMate Features (`~/projects/jobmate`)

7. **Distanz-Radar** — Leaflet-Karte auf der Jobs-Seite mit km-Kreisen. Koordinaten aus dem Geocoding-API-Response (`/api/geocode`) liegen bereits vor. Leaflet via `react-leaflet` einbinden, Nutzer-Standort als Mittelpunkt, Jobs als Pins, 15/30/50km-Kreise.

8. **CV-Export als PDF** — Verbesserter Lebenslauf (nach Claude-Chat) als PDF herunterladen. `react-pdf` oder `@react-pdf/renderer` einbinden. Einfaches A4-Template mit Name, Kontakt, Abschnitten — kein komplexes Design nötig, Funktion vor Form.

---

### Phase 4 — Cross-App-Tracking Verifikation

9. Nachdem Phase 1 implementiert ist: End-to-End-Test mit Demo-Teilnehmer `WID-DEMO1` (Max Mustermann, existiert in Supabase). Flow: Linguu-Aktivität tracken → WID-Dashboard prüfen ob Eintrag erscheint → dasselbe für JobMate. Falls Daten nicht ankommen: `api/participant/track` Route debuggen.

10. WID Koordinator-Dashboard: sicherstellen dass Linguu-Fortschritt und JobMate-Bewerbungsaktivität pro Teilnehmer korrekt aggregiert angezeigt werden. Basis dafür liegt in `004_pipeline_todos_deep_stats.sql` und den Tracking-Routes.

---

### Constraints — bitte einhalten

- **Dark Mode bleibt deaktiviert** in allen drei Apps — bewusste Entscheidung (Linguu nutzt hardcodierte Hex-Werte, visuelle Einheitlichkeit für Präsentationen). Nicht wieder einbauen.
- **WID bleibt Hub** — kein Lern-Content, keine Audio-Proxies, keine Vokabel-Daten in WID einbauen. Lernen passiert in Linguu, Jobs in JobMate.
- **Supabase Auth-Pattern** in WID strikt einhalten: `createClient` nur für `auth.getUser()`, `createAdminClient` für alle DB-Queries.
- Nach jeder Phase committen (selektives Staging, keine `.env`-Dateien).

---

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
| 2026-06-15 | Admin/Coordinator Redirect-Loop behoben: Login und Root-Router behandeln `global_admin` jetzt explizit als `/admin`; Admin-Layout prüft die DB-Rolle statt hartcodierter E-Mail und redirectet bei fehlender Berechtigung nach `/` statt zurück nach `/coordinator`. |
| 2026-06-15 | Demo-Blocker-Pass: Admin-APIs (`stats`, `todos`, `pipeline`) prüfen jetzt konsistent die DB-Rolle `global_admin` statt zusätzlich eine hartcodierte E-Mail. WID→Linguu/JobMate öffnet im gleichen Tab, weil beide Unter-Apps nun einen sichtbaren Rücklink zum WID-Hub haben. |
| 2026-06-15 | User-facing Rebranding: Dachplattform heißt jetzt **Enter** (Login, Hub, Admin, Teilnehmer-Navigation, Welcome/Guide). Der bisherige "Test/Citizenship"-Pfeiler heißt sichtbar **WID** und bündelt Orientierung, Einbürgerung und Inhalte für Geflüchtete. Technische `wid`-Parameter, Tracking-Routen und bestehende `WID-*` Teilnehmercodes bleiben aus Kompatibilitätsgründen unverändert; UI spricht von "Enter-Code". |
| 2026-06-16 | **Rebranding vollendet — WID vollständig aus der UI entfernt** (ersetzt die obige Teil-Entscheidung). Der Pfeiler heißt jetzt sichtbar **Orientierung** statt WID (`ParticipantNav` productName, Hub-Button "Orientierung öffnen", `einbuergerung`-Heading, Hub-Begrüßungstext). Teilnehmercodes werden ohne Marken-Prefix generiert (`lib/passwords.ts`: 6 Zeichen, kein `WID-`) — Login-Platzhalter neutralisiert. **Nicht-brechend:** bestehende `WID-*` Codes bleiben über `codeToEmail()` gültig, `@wid.internal`-Mapping + `?wid=`/`widCode`-Tracking unverändert (interne Technik, nie sichtbar). Verbleibende "WID"-Vorkommen sind nur noch Code-Kommentare. |
| 2026-06-15 | Teilnehmer-Header für Demo gehärtet: Sprachflagge hat jetzt Fallback, stabile Größe und explizite Emoji-Font-Familie, damit sie oben rechts auch bei unvollständigen Profil-/Font-Zuständen sichtbar bleibt. |
| 2026-06-07 | Audio aus LessonClient entfernt (gehört zu Linguu, nicht WID). OpenAI-Proxies gelöscht. GuideSection hinzugefügt (permanente 3-App-Anleitung auf Hub-Seite, einklappbar, bilingual) |
| 2026-06-08 | WID auf Hub/Reporting fokussiert: interne Linguu-Lernmodule, Progress-Route und Claude-Proxy entfernt; Einbürgerung als eigener Info-Bereich ergänzt |
| 2026-06-08/09 | Dark Mode Override aus globals.css entfernt — alle drei Apps (WID/Linguu/JobMate) bleiben fix im Light Theme für visuelle Einheitlichkeit. Demo-Teilnehmer Max Mustermann (WID-DEMO1) via Supabase Service Role angelegt mit realistischen Linguu + JobMate Aktivitätsdaten. |
| 2026-06-09 | Einbürgerungstest-Trainer: 460 BAMF-Fragen (questions.json + README) von linguu/src/Einbuergerung/ nach wid/data/einbuergerung/ verschoben. page.tsx komplett neu als interaktiver Quiz (Bundesland-Auswahl → 30 allgemein + 3 Bundesland-Fragen → Ergebnis). |
| 2026-06-09 | ParticipantNav: Flaggen-Emojis bei Sprachauswahl, prominentere Pill-Schaltfläche, Account-Name mittig in Top-Bar. FloatingTranslator: neues `components/lernen/FloatingTranslator.tsx` + API-Routes /api/translate, /api/tts, /api/whisper. Im Lernen-Layout eingebunden. |
| 2026-06-11 | Posthog Analytics eingebaut: `app/providers.tsx` (PHProvider Client Component), Layout gewrappt, Env Vars in Coolify gesetzt. Automatisches Page-View-Tracking aktiv. |
| 2026-06-15 | Nav-Performance: Teilnehmer-Tabs entkoppelt. Neuer `cache()`-Shared-Fetch `lib/participant.ts` lädt Auth+Profil 1× pro Request statt doppelt in Layout+Seite (vorher bis zu 4 Supabase-Roundtrips pro Tab-Wechsel). Linguu- und Jobs-Tab als Client-Components via neuem `ParticipantProvider`-Context (`components/lernen/ParticipantProvider.tsx`) → Tab-Wechsel jetzt instant ohne Server-Roundtrip. Hub nutzt denselben Shared-Fetch. Auth-Guard bleibt im Layout. |
