---
name: feature-specing
description: >-
  Unstrukturierte Feature-Ideen aufnehmen, gegen die Codebase pruefen,
  Rueckfragen stellen und ein implementierungsreifes Spec erzeugen.
  Verwende diesen Skill wenn der User sagt: "Feature spec", "Idee aufnehmen",
  "Feature beschreiben", "Spec erstellen", "feature-specing", "/feature-spec".
---

# /feature-specing — Von der Idee zum implementierungsreifen Spec

Du nimmst ungeordnete Feature-Ideen, Notizen oder Wunschlisten entgegen,
analysierst sie im Kontext der aktuellen Codebase und erzeugst daraus ein
implementierungsreifes Feature-Spec.

## Abgrenzung

- **Nicht** implementation-planning: Dieses Skill klaert WAS gebaut wird.
  implementation-planning klaert WIE es gebaut wird.
- **Nicht** research-coding: Dieses Skill schreibt das Spec.
  research-coding recherchiert Libraries/Patterns die das Spec erwaehnt.
- **Nicht** codebase-assessing: Dieses Skill prueft die Codebase nur soweit
  noetig um das Spec realistisch zu machen, nicht als Tiefenanalyse.

## Workflow

### Phase 1 — Eingang verstehen

1. Lies die Beschreibung der Idee sorgfaeltig.
2. Extrahiere: Ziel, Zielgruppe, betroffene Bereiche, Prioritaet, Constraints.
3. Wenn die Idee extrem vage ist, stelle sofort 3-5 schaerfende Fragen.

### Phase 2 — Codebase-Scan (leichtgewichtig)

1. Suche relevante Module, Komponenten, Routen, API-Endpunkte, DB-Schemas.
2. Nutze Agent(subagent_type="Explore") fuer breite Suchen.
3. Notiere bestehende Patterns die wiederverwendet werden koennen.
4. Identifiziere potenzielle Konflikte mit existierendem Code.

### Phase 3 — Gegenfragen

Formuliere praezise, nummerierte Fragen um Luecken zu schliessen:

- Unklare Business-Regeln oder Priorisierungen
- UX/UI-Details (Screens, States, Interaktionen)
- Datenmodell und Permissions
- Performance- und Security-Aspekte
- Abhaengigkeiten zu anderen Features oder externen Services

**Stelle die Fragen gebuendelt und warte auf Antworten.**
Iteriere bis ein belastbares Spec moeglich ist — lieber eine Runde
mehr fragen als ein Spec mit Luecken abliefern.

### Phase 4 — Spec schreiben

Erstelle das Spec nach dem Template in `templates/spec-template.md`.
Wichtige Regeln:

- **Scope klar abgrenzen**: In-Scope und Out-of-Scope explizit benennen.
- **Akzeptanzkriterien**: Konkret und ueberpruefbar formulieren.
- **Keine dynamischen Daten**: Keine Preise, Fees, Thresholds hardcoden.
  Stattdessen auf Code-Quellen verweisen (siehe `.claude/rules/no-dynamic-data-in-docs.md`).
- **Risiken ehrlich benennen**: Lieber ein bekanntes Risiko dokumentieren
  als es verschweigen.

### Phase 5 — Ablage

1. Schlage als Dateipfad vor: `docs/11_specs/<slug>.md`
2. `<slug>` = kebab-case, max 60 Zeichen, sprechend.
3. Frage den User ob der Pfad passt bevor du schreibst.

## Output

Ein einzelnes, vollstaendiges Markdown-Spec mit optionalem TL;DR am Anfang.

## Qualitaetskriterien

- [ ] Jede User Story hat mindestens ein Akzeptanzkriterium
- [ ] Scope-Abgrenzung ist explizit (In/Out)
- [ ] Betroffene Codebase-Stellen sind referenziert (Dateipfade)
- [ ] Offene Fragen sind dokumentiert (nicht versteckt)
- [ ] Keine Implementierungsdetails im Spec (das kommt im Plan)
