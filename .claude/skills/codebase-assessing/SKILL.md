---
name: codebase-assessing
description: >-
  Tiefe themenspezifische Analyse der Codebase (Security, Performance, UX,
  Architektur, Maintainability, DX, Datenfluesse) mit strukturiertem Report.
  Verwende diesen Skill wenn der User sagt: "Audit", "Assessment",
  "Codebase pruefen", "Security Check", "Performance Analyse",
  "Architektur Review", "codebase-assessing", "/assess".
---

# /codebase-assessing — Tiefe Codebase-Analyse

Du fuehrst tiefgehende, themenspezifische Assessments der Codebase durch
und erzeugst einen strukturierten Report mit Problemen, Risiken und
konkreten Massnahmen.

## Abgrenzung

- **Nicht** change-reviewing: Dieses Skill analysiert den IST-Zustand breit.
  change-reviewing fokussiert auf einen konkreten Diff/PR.
- **Nicht** gap-analyzing: Dieses Skill identifiziert Probleme.
  gap-analyzing vergleicht Soll gegen Ist.
- **Nicht** speed-audit: speed-audit ist spezialisiert auf Push-Architektur.
  Dieses Skill ist themenuebergreifend.

## Unterstuetzte Assessment-Typen

| Typ             | Fokus                                   | Typische Fragen                  |
| --------------- | --------------------------------------- | -------------------------------- |
| Security        | Auth, Injection, Secrets, CORS, RLS     | Gibt es ungeschuetzte Endpunkte? |
| Performance     | Queries, Rendering, Bundle, Caching     | Wo sind die Bottlenecks?         |
| UX              | States, Fehlerbehandlung, Accessibility | Sind alle Edge Cases abgedeckt?  |
| Architektur     | Coupling, Abstraktionen, Patterns       | Wo bricht die Struktur?          |
| Maintainability | Komplexitaet, Testbarkeit, DX           | Was ist schwer zu aendern?       |
| Datenfluesse    | DB → API → UI, Realtime, Sync           | Wo gehen Daten verloren?         |

## Workflow

### Phase 1 — Fokus klaeren

1. Frage nach dem Hauptthema (z.B. "Security im Auth-Flow").
2. Klaere den Scope: gesamte Codebase oder bestimmte Module?
3. Wenn der User kein Thema nennt, schlage 2-3 relevante vor.

### Phase 2 — Systematische Analyse

1. Nutze Agent(subagent_type="Explore") fuer breite Suchen.
2. Folge Import-/Export-Ketten um Abhaengigkeiten zu verstehen.
3. Identifiziere:
   - Anti-Patterns und gefaehrliche Annahmen
   - Fehlende Checks, Logs, Tests
   - Coupling und Spaghetti-Stellen
   - Inkonsistenzen zwischen aehnlichen Modulen

### Phase 3 — Adversariale Perspektive

**Explizit einnehmen:**

- Was passiert wenn ein Request 10x groesser ist als erwartet?
- Was passiert bei Race Conditions?
- Was passiert wenn ein externer Service ausfaellt?
- Was passiert wenn ein User boesartig handelt?
- Was passiert wenn Daten in unerwartetem Format ankommen?

### Phase 4 — Report schreiben

Erstelle den Report nach dem Template in `templates/assessment-template.md`.

**Regeln:**

- Jedes Problem bekommt einen Schweregrad (critical/high/medium/low/info).
- Jedes Problem bekommt eine konkrete Massnahme (nicht nur "sollte verbessert werden").
- Quick Wins (< 30 Min) klar von Deep Work (> 1 Tag) trennen.
- Staerken explizit benennen — nicht nur Probleme.

### Phase 5 — Ablage

Vorschlag: `docs/13_assessments/YYMMDD-<thema>.md` (YYMMDD = rueckwaerts geschriebenes Datum, z.B. `260418-deploy-safety.md` fuer 2026-04-18 — sortiert chronologisch)

## Output

Ein strukturierter Assessment-Report in Markdown.

## Qualitaetskriterien

- [ ] Scope und Annahmen sind dokumentiert
- [ ] Jedes Problem hat Schweregrad + betroffene Dateien + Massnahme
- [ ] Adversariale Perspektive ist erkennbar (nicht nur "sieht gut aus")
- [ ] Quick Wins sind klar identifiziert
- [ ] Mindestens 1 Staerke benannt (kein reiner Negativbericht)
