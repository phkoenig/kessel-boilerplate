# Dokumentation

Diese Dokumentation ist in mehrere Ebenen strukturiert, die unterschiedliche Zwecke erfüllen.

## Struktur

### 🧠 Core (machine-readable)

Diese Dokumentation wird von KI-Tools automatisch geladen und verwendet.

- **[01_governance/](01_governance/)** - Regeln, Standards und Hygiene-Vorschriften
- **[02_architecture/](02_architecture/)** - Technische Architektur und Systemaufbau
- **[03_features/](03_features/)** - Feature-Planung und Konzepte

### 🪶 Playground (human-readable)

Diese Dokumentation wird manuell gelesen, wenn Wissen benötigt wird.

- **[04_knowledge/](04_knowledge/)** - Erfahrungswissen, Learnings und How-Tos
- **[05_communication/](05_communication/)** - Kommunikationsrichtlinien
- **[06_history/](06_history/)** - Changelog und Versionshistorie
- **[07_automation/](07_automation/)** - Automatisierungs-Skripte und Workflows

## Schnellzugriff

### B2B App Shell (Aktuell)

- **App Shell Konzept**: [`03_features/neues_app_shell_konzept.md`](03_features/neues_app_shell_konzept.md)
  - 4-Spalten-Layout (Navbar, Explorer, Main, Assist)
  - react-resizable-panels
  - Custom Scrollbars
  - RBAC mit RoleGuard

### Theme-System

- **Supabase Themes Setup**: [`04_knowledge/supabase-themes-setup.md`](04_knowledge/supabase-themes-setup.md)
- **Token-Governance**: [`04_knowledge/TweakCN Tokenisierung und Theme-Entwicklung.md`](04_knowledge/TweakCN%20Tokenisierung%20und%20Theme-Entwicklung.md)

### Für Entwickler

- **Initial Setup**: [`04_knowledge/initial-setup.md`](04_knowledge/initial-setup.md) - Vollständige Einrichtungsanleitung mit Test-User Credentials
- **Deployment**: [`04_knowledge/deployment-guide.md`](04_knowledge/deployment-guide.md)
- **Secrets-Management**: [`04_knowledge/secrets-management.md`](04_knowledge/secrets-management.md)
- **MCP-Setup**: [`04_knowledge/mcp-setup.md`](04_knowledge/mcp-setup.md)

### Zukunftsvision

- **Kessel-Integration**: [`04_knowledge/kessel-integration-roadmap.md`](04_knowledge/kessel-integration-roadmap.md)

## Design-Token-Governance

Das Projekt verwendet strikte semantische Tokens (siehe `.cursor/rules/`):

| Kategorie   | Erlaubt                                    | Verboten                       |
| ----------- | ------------------------------------------ | ------------------------------ |
| **Farben**  | `bg-primary`, `text-success`, `bg-warning` | `bg-blue-500`, `text-[#333]`   |
| **Radii**   | `rounded-sm`, `rounded-md`, `rounded-lg`   | `rounded-[8px]`, `rounded-2xl` |
| **Spacing** | `p-4`, `gap-6`, `m-8`                      | `p-[17px]`, `gap-3`            |

## Wartung

- **Governance**: Änderungen über Pull Requests
- **Architecture**: Bei architektonischen Änderungen aktualisieren
- **Knowledge**: Kontinuierliche Ergänzung bei neuen Learnings
