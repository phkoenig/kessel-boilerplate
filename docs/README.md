# Dokumentation

## Konvention

| Ort              | Stil                           | Zweck                        |
| ---------------- | ------------------------------ | ---------------------------- |
| `.cursor/rules/` | Kurz, prägnant, technisch      | AI-Konsum, schnelle Referenz |
| `docs/`          | Ausführlich, narrativ, Kontext | Menschliches Verständnis     |

Die Cursor Rules sind die **Single Source of Truth** für Regeln und Konventionen.
Die `docs/`-Ordner enthalten erweiterte Erklärungen und Kontextinformationen.

## Struktur (nummerierte Ebenen)

```
docs/
├── 01_governance/    # Regeln, Index
├── 02_architecture/  # ADRs, DB-, Nav-, Theme-Architektur
├── 03_features/      # Feature-Specs, umgesetzte Systeme (inkl. ehem. specifications/)
├── 04_knowledge/     # How-Tos, Guides, Learnings (inkl. ehem. guides/, knowledge/)
├── 05_communication/ # Pitches, Kommunikation
├── 06_history/       # Changelog, Baselines
└── 07_automation/    # Automatisierung, CI-Hinweise
```

| Ordner              | Frage die es beantwortet             |
| ------------------- | ------------------------------------ |
| `01_governance/`    | "Welche Regeln gelten?"              |
| `02_architecture/`  | "Wie ist das System aufgebaut?"      |
| `03_features/`      | "Was tut Feature X?"                 |
| `04_knowledge/`     | "Wie mache ich Y?"                   |
| `05_communication/` | "Was kommunizieren wir?"             |
| `06_history/`       | "Was hat sich wann geändert?"        |
| `07_automation/`    | "Welche Automatisierung nutzen wir?" |

## Mapping: Cursor Rules → Knowledge

| Cursor Rule    | Erweiterter Guide                                                    |
| -------------- | -------------------------------------------------------------------- |
| `secrets.mdc`  | `04_knowledge/secrets-management.md`                                 |
| `supabase.mdc` | `04_knowledge/supabase_auth.md`, `supabase-migrationen.md`           |
| `theming.mdc`  | `04_knowledge/supabase-themes-setup.md`, `design-tokens-overview.md` |
| `nextjs.mdc`   | `04_knowledge/deployment-guide.md`                                   |
| `mcp.mdc`      | `04_knowledge/mcp-setup.md`                                          |

## Weitere Ordner (Projekt-Root)

| Ordner        | Inhalt                              |
| ------------- | ----------------------------------- |
| `examples/`   | Eigene Beispiele (lauffähiger Code) |
| `references/` | Externe Code-Referenzen zum Lernen  |

Diese werden bei Bedarf angelegt, nicht in `docs/`.
