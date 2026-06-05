-- Migration 005: Todos zurücksetzen auf aktuellen, ehrlichen Demo-Readiness-Stand
-- Im Supabase Dashboard → SQL Editor ausführen falls supabase db push nicht verfügbar.

DELETE FROM admin_todos;

INSERT INTO admin_todos (title, description, priority, category, status) VALUES

-- ── KRITISCH: Ohne diese Punkte kann keine Demo stattfinden ───────

('WID deployen: wid.techstag.de',
 'Coolify → neue Resource → GitHub-Repo wid. ENV setzen: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY. DNS: A-Record wid.techstag.de → 167.233.30.113.',
 'critical', 'tech', 'open'),

('JobMate deployen: jobmate.techstag.de',
 'Coolify → neue Resource → GitHub-Repo jobmate. ENV: ANTHROPIC_API_KEY. DNS: A-Record. Kein Backend nötig außer dem Next.js-Server.',
 'critical', 'tech', 'open'),

('Linguu: API-Keys auf serverseitige Route Handler migrieren',
 'Aktuell liegen VITE_ANTHROPIC_API_KEY und VITE_OPENAI_API_KEY im Browser-Bundle — sicherheitskritisch. Vor Deployment: Keys in /api/claude und /api/openai/tts|whisper verschieben, VITE_-Prefix entfernen.',
 'critical', 'tech', 'open'),

('Linguu deployen: linguu.techstag.de',
 'Erst nach API-Key-Migration (siehe vorheriges Todo). Coolify → neue Resource → GitHub-Repo linguu. DNS: A-Record.',
 'critical', 'tech', 'open'),

('Demo-Daten anlegen',
 'Koordinator-Account anlegen (z.B. demo@wid.de). 1 Testorganisation. 3 Testteilnehmer mit Login-Credentials. Mindestens 1 Teilnehmer soll in Linguu 2-3 Lektionen abgeschlossen haben, damit das Koordinator-Dashboard nicht leer aussieht.',
 'critical', 'business', 'open'),

-- ── HOCH: Macht die Demo überzeugend ─────────────────────────────

('DSGVO-Datenschutzerklärung',
 'Pflicht — du verarbeitest personenbezogene Daten von Einwanderern (Name, Lernstand, Bewerbungsdaten). Minimum: datenschutz.html auf wid.techstag.de verlinkt, Generator wie datenschutz-generator.de reicht für MVP. OHNE das kein legaler Verkauf.',
 'high', 'business', 'open'),

('AV-Vertrag mit erstem Träger',
 'Verein/Träger ist Auftraggeber, du bist Auftragsverarbeiter (personenbezogene Daten). Standard-AV-Vertrag nach Art. 28 DSGVO muss vor Pilot unterzeichnet sein. Vorlage: anwalt.de oder eigenes Template.',
 'high', 'business', 'open'),

('Teilnehmer-Onboarding: Welcome-Screen',
 '3-App-Ökosystem erklären bevor Teilnehmer loslegt: WID = Hub & Fortschritt, Linguu = Deutsch lernen, JobMate = Bewerbungen. Ohne Erklärung versteht kein Teilnehmer wozu der WID-Code gut ist.',
 'high', 'product', 'open'),

('Koordinator-Dashboard: Sprachniveau pro Teilnehmer',
 'Tabelle zeigt aktuell kein Assessment-Ergebnis (A1/A2/B1 etc.). Koordinatoren und Jobcenter wollen das als erstes sehen. Fix: assessment_results in ParticipantTable-Query joinen.',
 'high', 'product', 'open'),

('Angebot & Preisliste vorbereiten',
 'Für Verkaufsgespräch: 1-Pager mit Preis (40€/TN/Monat), was inkludiert ist, wie Onboarding aussieht, Referenz auf Pilot-Deal. Nicht ohne Angebot in ein Gespräch gehen.',
 'high', 'business', 'open'),

-- ── MITTEL: Wichtig aber kein Blocker für erste Demo ─────────────

('Impressum auf wid.techstag.de / techstag.de',
 'Rechtlich erforderlich für gewerbliche Website. Impressum-Generator: impressum.de oder eRecht24.',
 'medium', 'business', 'open'),

('PDF-Report für Jobcenter',
 'Jobcenter braucht Nachweise über Eigeninitiative. Druckbarer Fortschrittsbericht pro Teilnehmer: Lektionen, Quiz-Score, Bewerbungen. react-pdf oder einfaches window.print() mit print-CSS.',
 'medium', 'product', 'open'),

('Passwort-Reset UI für Koordinatoren',
 'API existiert bereits (/api/coordinator/reset-password). UI im Koordinator-Dashboard fehlt noch — Koordinatoren können aktuell kein Passwort zurücksetzen ohne direkten DB-Zugriff.',
 'medium', 'product', 'open'),

('Cross-App-Flow testen (end-to-end)',
 'Manuell durchspielen: WID-Code in Linguu eingeben → Lektion abschließen → im WID-Koordinator-Dashboard sichtbar → JobMate öffnen, WID-Code eingeben, Bewerbung abschicken → im WID-Dashboard sichtbar. Sicherstellen dass der gesamte Flow für Demo funktioniert.',
 'medium', 'tech', 'open'),

-- ── NIEDRIG: Nice-to-have vor Go-Live ────────────────────────────

('Google Workspace: hallo@techstag.de aktivieren',
 'Professionelle E-Mail für Akquise und Verträge. techstag.de als Alias-Domain in Google Workspace.',
 'low', 'business', 'open'),

('ThinkOrDrink via Coolify deployen',
 'Server läuft — ist ein einfaches Deployment. Bringt direkt ein weiteres Produkt online.',
 'low', 'tech', 'open');
