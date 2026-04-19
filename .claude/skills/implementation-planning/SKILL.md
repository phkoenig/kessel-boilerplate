---
name: implementation-planning
description: >-
  Aus Specs, Assessments oder Gap-Reports einen realistischen Umsetzungsplan
  mit konkreten Schritten, Abhaengigkeiten und Risiken erzeugen.
  Verwende diesen Skill wenn der User sagt: "Plan erstellen",
  "Implementierungsplan", "Wie bauen wir das", "Schritte planen",
  "implementation-planning", "/plan-impl".
---

# /implementation-planning — Vom Spec zum Umsetzungsplan

Du machst aus Specs, Assessments oder Gap-Reports einen klaren,
realistischen Plan mit konkreten Schritten, Abhaengigkeiten und Risiken.

## Abgrenzung

- **Nicht** feature-specing: Dort wird das WAS geklaert.
  Hier wird das WIE geplant.
- **Nicht** testing-code: Dort werden Tests implementiert.
  Hier wird geplant welche Tests noetig sind (als Schritt).
- **Nicht** EnterPlanMode: Der Claude Code Plan-Modus ist fuer
  session-interne Alignment-Planung. Dieser Skill erzeugt ein
  persistentes Planungsdokument.

## Workflow

### Phase 1 — Input analysieren

1. Klaere welche Artefakte als Grundlage dienen.
2. Lies alle referenzierten Specs, Assessments, Gap-Reports.
3. Identifiziere: Scope, Constraints, Abhaengigkeiten, Risiken.

### Phase 2 — Schritte entwerfen

Fuer jeden Schritt definiere:

- **Was** wird getan (konkret, nicht vage)
- **Wo** im Code (Dateipfade, Module, Services)
- **Abhaengigkeiten** (welche Schritte muessen vorher fertig sein)
- **Risiken** pro Schritt
- **Aufwands-Kategorie** (Quick Win / Medium / Deep Work)

### Phase 3 — Reihenfolge optimieren

1. **Quick Wins zuerst** wenn sie das Fundament fuer spaetere Schritte legen.
2. **Kritischer Pfad** identifizieren — welche Schritte blockieren alles andere?
3. **Parallelisierbare Arbeit** markieren.
4. **Test-Schritte** einbauen — nicht am Ende, sondern nach jedem logischen Block.

### Phase 4 — Realitaets-Check

Pruefe den Plan gegen:

- Gibt es versteckte Abhaengigkeiten die du uebersehen hast?
- Ist der Plan mit einem Developer in realistischer Zeit umsetzbar?
- Fehlen Migrationen, Deploys oder Config-Aenderungen?
- Sind Rollback-Pfade beruecksichtigt bei riskanten Schritten?

### Phase 5 — Plan schreiben

Erstelle den Plan nach dem Template in `templates/plan-template.md`.

### Phase 6 — Ablage

Vorschlag: `docs/12_plans/YYMMDD-<slug>.md` (YYMMDD = rueckwaerts geschriebenes Datum, z.B. `260418-mtf-oscillator-revival.md` fuer 2026-04-18 — sortiert chronologisch)

## Output

Ein strukturierter Implementierungsplan in Markdown.

## Qualitaetskriterien

- [ ] Jeder Schritt hat konkrete Dateipfade/Module
- [ ] Abhaengigkeiten sind explizit (nicht implizit "irgendwann vorher")
- [ ] Quick Wins sind klar identifiziert
- [ ] Kritischer Pfad ist erkennbar
- [ ] Test-Schritte sind eingebaut (nicht nur am Ende)
- [ ] Definition of Done ist konkret und ueberpruefbar
