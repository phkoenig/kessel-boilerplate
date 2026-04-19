---
name: gap-analyzing
description: >-
  Soll-Ist-Vergleich zwischen Specs, Assessments, Plans und aktuellem Code.
  Findet verbleibende Luecken, Regressionen und unvollstaendige Fixes.
  Verwende diesen Skill wenn der User sagt: "Gap Analyse", "Was fehlt noch",
  "Luecken finden", "Soll-Ist", "Regressionen pruefen", "gap-analyzing",
  "/gap-analyze".
---

# /gap-analyzing — Luecken zwischen Soll und Ist finden

Du vergleichst Soll-Artefakte (Specs, Assessments, Plans) mit dem aktuellen
Code und identifizierst verbleibende Luecken, neue Probleme und Regressionen.

## Abgrenzung

- **Nicht** codebase-assessing: Dort wird der IST-Zustand analysiert.
  Hier wird Soll gegen Ist verglichen.
- **Nicht** change-reviewing: Dort wird ein konkreter Diff bewertet.
  Hier wird gegen ein Referenz-Artefakt geprueft.
- **Nicht** testing-code: Dort werden Tests geschrieben.
  Hier werden Luecken dokumentiert die ggf. Tests brauchen.

## Workflow

### Phase 1 — Referenzen einsammeln

1. Klaere welche Artefakte als Soll dienen:
   - Ein Spec aus `docs/11_specs/`?
   - Ein Assessment aus `docs/13_assessments/`?
   - Ein Plan aus `docs/12_plans/`?
   - Ein frueherer Gap-Report aus `docs/10_gaps/`?
2. Lade diese Artefakte und extrahiere die konkreten Anforderungen/Massnahmen.

### Phase 2 — Soll-Ist-Mapping

Fuer jede Anforderung oder Massnahme aus dem Referenz-Artefakt:

1. Suche die relevante Stelle in der Codebase.
2. Bewerte den Status:
   - **Umgesetzt** — Anforderung vollstaendig erfuellt
   - **Teilweise** — Kern vorhanden, aber Luecken
   - **Nicht umgesetzt** — Nichts davon im Code
   - **Falsch umgesetzt** — Code vorhanden, aber nicht korrekt
   - **Regressiv** — War mal umgesetzt, ist jetzt kaputt

### Phase 3 — Neue Probleme identifizieren

Pruefe zusaetzlich:

- Hat die Umsetzung **neue** Probleme erzeugt?
- Gibt es **Inkonsistenzen** zwischen verschiedenen Teilen der Umsetzung?
- Sind durch Aenderungen **Folgeprobleme** in unbeteiligten Modulen entstanden?
- Gibt es **technische Schulden** die waehrend der Umsetzung aufgebaut wurden?

### Phase 4 — Report schreiben

Erstelle den Report nach dem Template in `templates/gap-template.md`.

**Regeln:**

- Jede Luecke muss auf eine konkrete Soll-Anforderung referenzieren.
- Schweregrad an Business-Impact koppeln, nicht an technische Komplexitaet.
- Vorschlag zur Schliessung pro Luecke — nicht nur Problem benennen.

### Phase 5 — Ablage

Vorschlag: `docs/10_gaps/YYMMDD-<bezug>.md` (YYMMDD = rueckwaerts geschriebenes Datum, z.B. `260418-deploy-safety.md` fuer 2026-04-18 — sortiert chronologisch)

## Output

Ein strukturierter Gap-Report in Markdown.

## Qualitaetskriterien

- [ ] Jede Luecke referenziert eine konkrete Soll-Anforderung
- [ ] Status pro Anforderung ist klar (umgesetzt/teilweise/nicht/falsch/regressiv)
- [ ] Neue Folgeprobleme sind separat aufgefuehrt
- [ ] Priorisierung ist nachvollziehbar begruendet
- [ ] Vorschlaege zur Schliessung sind konkret
