---
name: skill-system-playbook
description: >-
  Best Practices, Governance und Weiterentwicklungsregeln fuer das
  Claude Code Skill-System. Referenz-Dokument, kein operativer Workflow.
  Verwende diesen Skill wenn der User sagt: "Skill Best Practices",
  "Skill-System verbessern", "Neuen Skill designen", "Skill Governance",
  "skill-system-playbook", "/skill-playbook".
---

# /skill-system-playbook — Governance fuer das Skill-System

Dieses Dokument definiert die Regeln, Best Practices und Governance
fuer das modulare Skill-System. Es ist eine Referenz, kein operativer
Workflow — du kannst es jederzeit konsultieren.

## 1. Skill-Architektur

### 1.1 Drei Ebenen der Agent-Steuerung

| Ebene                       | Datei                       | Zweck                             | Aenderungsfrequenz                   |
| --------------------------- | --------------------------- | --------------------------------- | ------------------------------------ |
| **Projekt-Kontext**         | `CLAUDE.md` + `AGENTS.md`   | Architektur, Regeln, Konventionen | Selten (bei Architektur-Aenderungen) |
| **Wiederholbare Workflows** | `.claude/skills/*/SKILL.md` | Spezifische, aufrufbare Ablaeufe  | Mittel (bei Workflow-Verbesserungen) |
| **Thread-Prompts**          | User-Nachrichten            | Konkrete Aufgabenbeschreibung     | Immer (jede Session)                 |

### 1.2 Skill-Anatomie

```
.claude/skills/<skill-name>/
  SKILL.md          — Frontmatter + Instruktionen (< 500 Zeilen)
  templates/         — Markdown-Templates fuer Outputs (optional)
```

**Frontmatter-Regeln:**

- `name`: kebab-case, max 64 Zeichen, sprechend
- `description`: einzeilig, praegnant — das ist das Wichtigste fuer Discovery
- `disable-model-invocation: true`: nur fuer manuell ausgeloeste Skills

## 2. Skill-Design-Prinzipien

### 2.1 Ein Skill = Ein klarer Zweck

- Jeder Skill hat genau EINEN Primaer-Output (Spec, Report, Plan, Tests, ...).
- Wenn ein Skill zwei verschiedene Dinge erzeugt → in zwei Skills aufteilen.
- Wenn zwei Skills fast identisch sind → zusammenlegen.

### 2.2 Abgrenzung ist Pflicht

Jeder Skill MUSS einen "Abgrenzung"-Block haben der klaert:

- Was ist NICHT dieser Skill?
- Welcher andere Skill waere stattdessen richtig?
- Wann uebergibt dieser Skill an einen anderen?

### 2.3 Workflow statt Wunschliste

- Beschreibe HOW (konkreter Ablauf), nicht nur WHAT (gewuenschtes Ergebnis).
- Phasen mit klaren Schritten, nicht vage Aufforderungen.
- Qualitaetskriterien als Checkliste am Ende.

### 2.4 Templates sind Gold wert

- Jeder Skill der ein Markdown-Artefakt erzeugt braucht ein Template.
- Templates leben in `templates/` Unterordner.
- Templates definieren die Struktur, nicht den Inhalt.

## 3. Global vs. Projektlokal

### 3.1 Global (`~/.claude/skills/`)

Fuer Skills die in jedem Projekt funktionieren:

- anti-deathloop (universell)
- skill-system-playbook (Meta, universell)
- Generische Versionen von research-coding, feature-specing, etc.

### 3.2 Projektlokal (`.claude/skills/`)

Fuer Skills die projektspezifische Pfade, Konventionen oder Tools nutzen:

- testing-code (kennt pytest + vitest Setup)
- quantlab-dispatch (nutzt MCP-Tools)
- strategy-registration (kennt Supabase Schema)
- Alle Skills die auf `docs/XX_ordner/` Struktur verweisen

### 3.3 Empfehlung fuer dieses Projekt

**Die 9 Skills in `.claude/skills/` sind projektlokal** weil sie auf die
kessel-boilerplate Doku-Ordnerstruktur (`docs/08_research` bis `docs/13_assessments`)
und auf projektspezifische Konventionen (Clerk, Supabase, Next.js, Vitest, Playwright)
verweisen. Globale Varianten koennen spaeter als abgespeckte Kopien erstellt werden.

### 3.4 Cursor-Kompatibilitaet

Cursor entdeckt Skills automatisch aus globalen Pfaden (`~/.claude/skills/`,
`~/.cursor/skills-cursor/`). Projektlokale `.claude/skills/` erscheinen **nicht**
automatisch in der Cursor-Skill-Liste. Sie werden aber genutzt durch:

1. **Expliziter Aufruf:** User sagt "Wende gap-analyzing an" — Agent liest `.claude/skills/gap-analyzing/SKILL.md` und befolgt den Workflow.
2. **AGENTS.md im Root:** Macht das Skill-System bei jedem neuen Agent-Start sichtbar.
3. **Optional fuer Auto-Discovery:** User kopiert die Skills zusaetzlich nach `~/.cursor/skills-cursor/` — dann erscheinen sie in der Cursor-Skill-Liste.

## 4. Skill-Inventar (kessel-boilerplate)

### Operative Skills (erzeugen Artefakte)

| Skill                   | Output-Ordner          | Naming                   | Trigger-Beispiele                     |
| ----------------------- | ---------------------- | ------------------------ | ------------------------------------- |
| feature-specing         | `docs/11_specs/`       | `<slug>.md` (living doc) | "Feature spec", "Idee aufnehmen"      |
| codebase-assessing      | `docs/13_assessments/` | `YYMMDD-<thema>.md`      | "Audit", "Security Check"             |
| gap-analyzing           | `docs/10_gaps/`        | `YYMMDD-<bezug>.md`      | "Was fehlt noch", "Soll-Ist"          |
| implementation-planning | `docs/12_plans/`       | `YYMMDD-<slug>.md`       | "Plan erstellen", "Wie bauen wir das" |
| testing-code            | `src/**/*.test.*`      | (test conventions)       | "Tests schreiben", "Testabdeckung"    |
| change-reviewing        | `docs/09_reviews/`     | `YYMMDD-<thema>.md`      | "Review", "Diff pruefen"              |
| research-coding         | `docs/08_research/`    | `<slug>.md` (living doc) | "Research", "Library suchen"          |
| anti-deathloop          | (Chat-Output)          | —                        | "Stuck", "Deathloop"                  |

### Naming-Konvention: YYMMDD-Prefix fuer zeit-verankerte Artefakte

Skill-Outputs in `09_reviews/`, `10_gaps/`, `12_plans/`, `13_assessments/` MUESSEN
mit `YYMMDD-` beginnen (rueckwaerts geschriebenes Datum, z.B. `260418-` fuer 2026-04-18).
Grund: chronologische Auto-Sortierung im Filesystem, gleicher Stil wie Trading-Manifeste
(`KAT-MANIFEST-260329-...`).

Living Docs (Specs, Research) bleiben **ohne** Datum, da sie ueber die Zeit gepflegt werden.

### Archive-Pattern

Jeder Doku-Folder hat ein optionales `archive/` Subfolder fuer veraltete oder superseded
Inhalte. Bewege nicht-mehr-relevante Files dorthin statt zu loeschen — Git-History
bleibt, Context-Pollution sinkt. Bestehende refs auf die Datei mit `sed` aktualisieren.

### Domain-Skills (projektspezifisch, noch nicht importiert)

Bei Bedarf aus market-magnet-2601 oder eigenen Workflows ableiten. Kandidaten fuer
kessel-boilerplate:

| Skill (Vorschlag)    | Zweck                                     |
| -------------------- | ----------------------------------------- |
| theme-snapshot-check | Audit der Theme-Snapshot-Pipeline         |
| clerk-webhook-health | Clerk-Sync- und Webhook-Debugging         |
| supabase-rls-audit   | RLS-Policies gegen Feature-Spec pruefen   |
| vercel-deploy-verify | Post-Deploy-Smoke-Check gegen Preview-URL |

### Meta-Skills

| Skill                 | Zweck          |
| --------------------- | -------------- |
| skill-system-playbook | Diese Referenz |

## 5. Typische Skill-Ketten

### Feature-Entwicklung (komplett)

```
1. /research        — Gibt es was Fertiges?
2. /feature-spec    — Was genau bauen wir?
3. /plan-impl       — Wie bauen wir es?
4. (Implementierung)
5. /test            — Tests schreiben
6. /review          — Aenderungen pruefen
7. /gap-analyze     — Nichts vergessen?
```

### Bug-Fix

```
1. /assess          — Wo liegt das Problem?
2. (Fix implementieren)
3. /test            — Regressionstest
4. /review          — Fix pruefen
```

### Qualitaets-Audit

```
1. /assess          — Probleme identifizieren
2. /gap-analyze     — Gegen Spec/Plan pruefen
3. /plan-impl       — Fixes planen
```

### Festgefahrener Thread

```
1. /escape          — Problem exportieren
2. (Neuer Chat mit Export)
3. (Loesung zurueckbringen)
```

## 6. Evolutions-Regeln

### 6.1 Neue Skills

- Nur aus **echten, wiederkehrenden** Workflows ableiten.
- Mindestens 3x manuell durchgefuehrt bevor ein Skill draus wird.
- Erst als `disable-model-invocation: true` testen.

### 6.2 Skill-Audit (vierteljaehrlich)

Frage fuer jeden Skill:

1. Wurde er in den letzten 3 Monaten genutzt? Wenn nein → loeschen.
2. Ist der Scope noch richtig? Zu gross → aufteilen. Zu klein → mergen.
3. Stimmt die Abgrenzung noch? Ueberschneidungen → klaeren.
4. Ist das Template noch aktuell? Veraltete Felder → entfernen.

### 6.3 Ueberschneidungen

Wenn zwei Skills aehnliche Dinge tun:

1. Pruefen ob es tatsaechlich verschiedene Workflows sind.
2. Wenn ja: Abgrenzung schaerfen und in beiden Skills dokumentieren.
3. Wenn nein: Den spezifischeren behalten, den generischen loeschen.

## 7. Anti-Patterns

| Anti-Pattern                    | Warum schlecht                  | Stattdessen                     |
| ------------------------------- | ------------------------------- | ------------------------------- |
| Mega-Skill (> 500 Zeilen)       | Wird nicht vollstaendig gelesen | In 2-3 Skills aufteilen         |
| Vage Description                | Wird nicht gefunden             | Konkrete Trigger-Woerter        |
| Nur WHAT, kein HOW              | Agent improvisiert              | Klare Phasen + Schritte         |
| Kein Template                   | Inkonsistente Outputs           | Template im `templates/` Ordner |
| Kein Abgrenzungs-Block          | Skill-Verwirrung                | "Nicht X, nicht Y" Block        |
| Global obwohl projektspezifisch | Bricht in anderen Projekten     | Projektlokal anlegen            |

## 8. Deathloop-Praevention (Meta)

Die wichtigste Funktion dieses Skill-Systems ist **Struktur statt Chaos**:

1. **Explore vor Code:** feature-specing + research-coding VOR implementation-planning
2. **Plan vor Code:** implementation-planning VOR Implementierung
3. **Review nach Code:** change-reviewing + gap-analyzing NACH Implementierung
4. **Exit wenn stuck:** anti-deathloop statt endlosem Retry

Dieses Pattern (Explore → Plan → Code → Review) reduziert:

- **Planloses Coden:** weil immer erst ein Spec/Plan existiert
- **Redundante Arbeit:** weil Research vor Implementierung kommt
- **Deathloops:** weil ein sauberer Exit-Pfad existiert
- **Vergessene Luecken:** weil Gap-Analyse nach der Arbeit kommt
