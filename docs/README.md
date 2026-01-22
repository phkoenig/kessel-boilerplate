# Dokumentation

## Konvention

| Ort              | Stil                           | Zweck                        |
| ---------------- | ------------------------------ | ---------------------------- |
| `.cursor/rules/` | Kurz, prägnant, technisch      | AI-Konsum, schnelle Referenz |
| `docs/`          | Ausführlich, narrativ, Kontext | Menschliches Verständnis     |

Die Cursor Rules sind die **Single Source of Truth** für Regeln und Konventionen.
Die `docs/`-Ordner enthalten erweiterte Erklärungen und Kontextinformationen.

## Struktur

```
docs/
├── architecture/     # Systemdesign, Datenbank, APIs, Deployment-Architektur
├── specifications/   # PRDs, Feature-Specs, RFCs (was gebaut werden soll)
├── guides/           # Tech-Stack-Guides (wie man Technologien nutzt)
└── knowledge/        # Learnings, Research, ADRs (was wir gelernt haben)
```

| Ordner            | Frage die es beantwortet        | Cursor Rule Pendant                 |
| ----------------- | ------------------------------- | ----------------------------------- |
| `architecture/`   | "Wie ist das System aufgebaut?" | `architecture.mdc`                  |
| `specifications/` | "Was soll gebaut werden?"       | -                                   |
| `guides/`         | "Wie nutze ich Technologie X?"  | `supabase.mdc`, `secrets.mdc`, etc. |
| `knowledge/`      | "Was haben wir dabei gelernt?"  | -                                   |

## Mapping: Cursor Rules → Guides

| Cursor Rule    | Erweiterter Guide                                                     |
| -------------- | --------------------------------------------------------------------- |
| `secrets.mdc`  | `guides/secrets-management.md`                                        |
| `supabase.mdc` | `guides/supabase_auth.md`, `guides/supabase-migrationen.md`           |
| `theming.mdc`  | `guides/supabase-themes-setup.md`, `guides/design-tokens-overview.md` |
| `nextjs.mdc`   | `guides/deployment-guide.md`                                          |
| `mcp.mdc`      | `guides/mcp-setup.md`                                                 |

## Weitere Ordner (Projekt-Root)

| Ordner        | Inhalt                              |
| ------------- | ----------------------------------- |
| `examples/`   | Eigene Beispiele (lauffähiger Code) |
| `references/` | Externe Code-Referenzen zum Lernen  |

Diese werden bei Bedarf angelegt, nicht in `docs/`.
