# AGENTS.md — Einstieg fuer KI-Agenten (Cursor, Claude Code, Windsurf)

> **Kurzfassung:** Dieses Projekt verwendet ein modulares Skill-System unter
> `.claude/skills/` fuer wiederkehrende Workflows (Assess, Gap, Plan, Review, Spec,
> Research, Test). Skills sind **projektlokal** — sie erscheinen nicht automatisch
> in der Cursor-Skill-Liste, werden aber genutzt sobald du sie liest und befolgst.

## 1. Zuerst lesen

Bei jeder neuen Session als Pflichtlektuere:

1. `README.md` — Projektuebersicht, Tech-Stack, Scripts
2. `.cursor/rules/architecture.mdc` — SOLID/CLARITY-Prinzipien
3. `.cursor/rules/documentation.mdc` — TSDoc-Standards
4. `.cursor/rules/mcp.mdc` — MCP-Governance (Supabase, Context7)
5. Dieses Dokument

## 2. Skill-System

### 2.1 Was liegt wo

| Pfad                          | Inhalt                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `.claude/skills/*/SKILL.md`   | Workflow-Definitionen (Frontmatter + Phasen + Templates) |
| `.claude/skills/*/templates/` | Markdown-Templates fuer Outputs                          |
| `docs/08_research/`           | Output von `research-coding` (Living Docs)               |
| `docs/09_reviews/`            | Output von `change-reviewing` (YYMMDD-Prefix)            |
| `docs/10_gaps/`               | Output von `gap-analyzing` (YYMMDD-Prefix)               |
| `docs/11_specs/`              | Output von `feature-specing` (Living Docs)               |
| `docs/12_plans/`              | Output von `implementation-planning` (YYMMDD-Prefix)     |
| `docs/13_assessments/`        | Output von `codebase-assessing` (YYMMDD-Prefix)          |

### 2.2 Verfuegbare Skills

| Skill                     | Trigger                                              | Output                  |
| ------------------------- | ---------------------------------------------------- | ----------------------- |
| `skill-system-playbook`   | "Skill Best Practices", "Skill-System verbessern"    | Referenz, kein Artefakt |
| `research-coding`         | "Research", "Library suchen", "Gibt es was fertiges" | `docs/08_research/`     |
| `feature-specing`         | "Feature spec", "Idee aufnehmen"                     | `docs/11_specs/`        |
| `codebase-assessing`      | "Audit", "Assessment", "Security Check"              | `docs/13_assessments/`  |
| `gap-analyzing`           | "Was fehlt", "Soll-Ist", "Luecken"                   | `docs/10_gaps/`         |
| `implementation-planning` | "Plan erstellen", "Wie bauen wir das"                | `docs/12_plans/`        |
| `change-reviewing`        | "Review", "Diff pruefen"                             | `docs/09_reviews/`      |
| `testing-code`            | "Tests schreiben", "Testabdeckung"                   | `*.test.ts`, `e2e/*`    |
| `anti-deathloop`          | "Stuck", "Deathloop", "Export fuer neuen Chat"       | Plain-Text-Bloecke      |

### 2.3 Typische Ketten

- **Feature komplett:** research → feature-spec → plan-impl → (Code) → test → review → gap-analyze
- **Bug-Fix:** assess → (Fix) → test → review
- **Qualitaets-Audit:** assess → gap-analyze → plan-impl

### 2.4 Naming-Konvention

Zeit-verankerte Artefakte in `09_reviews/`, `10_gaps/`, `12_plans/`, `13_assessments/`
beginnen mit `YYMMDD-` (rueckwaerts, z.B. `260419-` fuer 2026-04-19). Grund:
chronologische Auto-Sortierung im Filesystem.

Living Docs (`08_research/`, `11_specs/`) bleiben **ohne** Datum im Dateinamen.

## 3. Wie du einen Skill anwendest

1. User aeussert einen Trigger (siehe Tabelle oben) oder du erkennst den Bedarf proaktiv.
2. Lies `.claude/skills/<skill>/SKILL.md` vollstaendig.
3. Lies ggf. das zugehoerige Template in `templates/`.
4. Folge dem Workflow Phase fuer Phase.
5. Fuelle das Template, schlage den Dateipfad vor (siehe Skill), schreibe nach User-OK.

## 4. Projekt-spezifische Guardrails (aus User-Rules)

- **Sprache:** Deutsch (der User heisst Philip, Du-Form).
- **Philosophie:** KISS, Refaktorisierung vor Neubau, Dateien < 300 LOC.
- **Dev-Origin:** Kanonisch ist die HTTPS-Subdomain `<projekt>-dev.megabrain.cloud`,
  nicht `localhost`. Erst-Setup pro Projekt: `pnpm dev:setup-tunnel`. Daily:
  `pnpm dev:domain`. Master-Doku + Allokationsliste (SSOT):
  [`docs/02_architecture/dev-https-subdomain.md`](docs/02_architecture/dev-https-subdomain.md).
  Wenn ein neues Projekt aus dieser Boilerplate ableitet wird, MUSS die
  Allokationstabelle dort um Slug + Port + Subdomain + Tunnel-UUID ergaenzt
  werden — andere Repos spiegeln nur, dieses Repo ist die Wahrheit.
- **Dev-Server:** Vor `npm run dev` IMMER Ports pruefen und alte Prozesse killen.
- **Secrets:** Ausschliesslich in Supabase Vault. `.env` nur fuer Bootstrap.
- **DB:** Supabase ist Single Source of Truth. Keine parallelen Backends.
- **MCPs:** Chrome DevTools + Supabase + Context7 sind Default-On.
- **Temp-Dateien:** Namen mit `TEMP_`-Prefix.
- **Code-Editing:** `edit_file` statt `search_replace`, eine Aenderung pro Operation,
  nach jeder Aenderung Dev-Server/Build pruefen oder commiten.

## 5. Skill-System erweitern

Wenn ein Workflow 3x manuell durchgefuehrt wurde und wiederkehrt → neuen Skill
anlegen nach dem Muster in `.claude/skills/skill-system-playbook/SKILL.md` Abschnitt 6.
