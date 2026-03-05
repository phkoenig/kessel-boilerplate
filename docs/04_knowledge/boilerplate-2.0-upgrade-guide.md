# Boilerplate 2.0 Upgrade-Guide

Überblick über die Migration von Boilerplate 1.x auf 2.0 (Clerk + SpacetimeDB).

## Architektur-Änderungen

| Bereich       | 1.x                  | 2.0                                        |
| ------------- | -------------------- | ------------------------------------------ |
| Auth          | Supabase Auth        | Clerk (Organizations = Tenant-Quelle)      |
| UI-Updates    | Reload/Polling       | Realtime-Invalidierung (SpacetimeDB-ready) |
| Tenant-Quelle | `profiles.tenant_id` | `app.tenants.clerk_org_id`                 |
| API-Schutz    | Teilweise            | Vereinheitlicht (requireAuth/requireAdmin) |

## Upgrade-Schritte für bestehende Projekte

### 1. Clerk Setup

- Clerk-Projekt anlegen: [clerk.com](https://clerk.com)
- Environment-Variablen: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
- Webhook: `https://<domain>/api/webhooks/clerk` für `user`, `organization`, `organizationMembership`
- Vgl. `docs/04_knowledge/clerk-setup.md`

### 2. Identity-Migration

- Migrationen 032–035 ausführen (clerk_user_id, profiles FK, app.tenants.clerk_org_id)
- Backfill: `node scripts/backfill-clerk-profiles.mjs --dry-run` dann `--apply`
- Rollback-Doku: `docs/04_knowledge/clerk-migration-rollback.md`

### 3. Realtime (optional)

- Ohne SpacetimeDB: Mock-Adapter aktiv (app:invalidate → router.refresh)
- Mit SpacetimeDB: Modul deployen, Bindings generieren, `spacetime-adapter` integrieren
- Vgl. `docs/04_knowledge/spacetime-spike.md`

### 4. Vercel Secrets

- Clerk-Keys als Private Variables
- `NEXT_PUBLIC_*` als Public (nur nicht-sensible Werte)
- Supabase Vault bleibt zentrale Quelle: `pnpm pull-env` vor Deploy

## Neue Ableitungen (kessel init)

- Standard-Preset: `clerk-spacetimedb-ui`
- Template: `phkoenig/kessel-boilerplate`
- Required Envs: Supabase + Clerk (siehe `template.manifest.json`)
