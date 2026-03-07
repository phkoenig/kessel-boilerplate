# Ebene 2: Architecture

**Typ:** 🧠 Core (machine-readable)

## Zweck

Diese Ebene beschreibt _wie_ das System aufgebaut ist. Sie dokumentiert die technische Architektur, Layer, Datenzugriff und Deployment-Strategien.

## Inhalt

- **Architecture Decision Records**: [`ADR-001-clerk-organizations-tenant-source.md`](ADR-001-clerk-organizations-tenant-source.md) – Clerk Organizations = Tenant Source of Truth
- **Architecture Decision Records**: [`ADR-002-boilerplate-3-0-system-boundaries.md`](ADR-002-boilerplate-3-0-system-boundaries.md) – Clerk = Identity, Spacetime = Core, Supabase = App DB/Storage, 1Password = Secrets
- **Hard-Cutover Guardrails**: [`boilerplate-3-0-hard-cutover-guardrails.md`](boilerplate-3-0-hard-cutover-guardrails.md) – verbotene Legacy-Muster, Suchlisten und finale 3.0-Grenzen
- **Datenbank-Architektur**: Boilerplate 3.0 trennt Boilerplate-Core (`Spacetime`) von App-DB und Storage (`Supabase`)
- **Technische Referenz**: Siehe `README.md` → "Tech Stack" und "Projektstruktur"
- **Secrets- und MCP-Konfiguration**: Siehe `README.md` und `docs/guides/secrets-management.md`
- **Proxy & Routing**: Siehe `src/proxy.ts` (Next.js 16) und `src/app/`
- **Layout-Architektur**: Siehe `docs/03_features/neues_app_shell_konzept.md`
- **Deployment**: Siehe `docs/04_knowledge/deployment-guide.md`

## Nutzung

Diese Informationen werden von KI-Tools verwendet, um Architektur-konformen Code zu generieren.

## Wartung

Bei architektonischen Änderungen muss diese Dokumentation aktualisiert werden.
