# Einbürgerungstest / "Leben in Deutschland" – Fragendatensatz

Extrahiert aus dem offiziellen *Gesamtfragenkatalog* des BAMF (Stand 07.05.2025).
**460 Fragen, alle mit richtiger Antwort befüllt.**

## Inhalt
- `questions.json` – alle 460 Fragen (300 allgemeine + 16 Bundesländer × 10) inkl. Lösung
- `einbuergerungstest-bilder.zip` → `images/` – 42 PNG-Bilder für die bildbasierten Fragen

## Schema (pro Frage)
```json
{
  "id": "g001",                 // g001–g300 = allgemein, bw01–th10 = Bundesländer
  "part": "Allgemein",          // "Allgemein" oder "Bundesland"
  "category": "Allgemein",      // "Allgemein" oder Name des Bundeslands
  "localNumber": 1,             // Aufgabennummer im jeweiligen Teil
  "question": "In Deutschland dürfen Menschen …",
  "options": ["…","…","…","…"], // immer genau 4
  "type": "text",               // "text" oder "image"
  "image": null,                // bei Bildfragen: "images/<id>.png", sonst null
  "correctIndex": 3,            // 0–3 = Index der richtigen Option in "options"
  "confidence": "hoch",         // "hoch" oder "aktuell" (siehe unten)
  "sourcePage": null            // Seite im Original-PDF (nur bei Bildfragen)
}
```

### Bundesland-Kürzel
`bw` Baden-Württemberg · `by` Bayern · `be` Berlin · `bb` Brandenburg · `hb` Bremen ·
`hh` Hamburg · `he` Hessen · `mv` Mecklenburg-Vorpommern · `ni` Niedersachsen ·
`nw` Nordrhein-Westfalen · `rp` Rheinland-Pfalz · `sl` Saarland · `sn` Sachsen ·
`st` Sachsen-Anhalt · `sh` Schleswig-Holstein · `th` Thüringen

## Bildfragen (42 Bilder)
- 36 Fragen mit `type:"image"`: Optionen sind `"Bild 1"…"Bild 4"` bzw. `"1"…"4"`
  (Länder-Wappen, Bundes-/EU-/DDR-Wappen, Landkarten, Stimmzettel). Das PNG zeigt die
  Originalseite mit allen vier Bildoptionen → in der App Bild anzeigen + 4 Auswahlbuttons.
- 6 Fragen mit `type:"text"`, die aber ein Bild in der Aufgabe enthalten (z. B. „Was zeigt
  dieses Bild?"): Optionen sind Text, zusätzlich ist über `image` das Seiten-PNG hinterlegt.

## Richtige Antworten – Herkunft & Verlässlichkeit
Das offizielle PDF markiert die Lösungen **nicht**. `correctIndex` wurde wie folgt befüllt:
- **Bildfragen** (Wappen/Flaggen/Karten/Stimmzettel): visuell anhand der gerenderten
  Originalseiten bestimmt.
- **Textfragen**: aus dem standardisierten, seit Jahren stabilen Bundeskatalog.

Das Feld **`confidence`** kennzeichnet, wie stabil eine Antwort ist:
- `"hoch"` (441 Fragen): stabile Antwort.
- `"aktuell"` (19 Fragen): zeitabhängig, vor dem Lernen kurz prüfen. Betrifft:
  - allgemeine Fragen zu **aktuellem Bundeskanzler (g072), Staatsoberhaupt (g075) und den
    größten Fraktionen (g073)** – Stand Juni 2026: Friedrich Merz, Frank-Walter Steinmeier,
    CDU/CSU + AfD.
  - alle **Kommunalwahl-Wahlalter-Fragen (x04)**: 18 in BY, HE, RP, SL, SN; sonst 16.

Empfehlung: Für ein Prüfungs-Lerntool die Antworten stichprobenartig gegen den offiziellen
BAMF-Test (bamf-navi.bamf.de) gegenprüfen, insbesondere die `"aktuell"`-Fragen.
