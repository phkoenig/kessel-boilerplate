# Legacy-Migrationen (Pre–Boilerplate 3.0)

Die SQL-Dateien in diesem Ordner wurden aus `supabase/migrations/` herausgenommen, weil der **Boilerplate-Core** (User-Shadow, Rollen, Clerk-Mapping, `app_settings`-Metadaten fuer die Shell) ab **3.0** ausschliesslich ueber **SpacetimeDB** laeuft (siehe [docs/02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md](../../../docs/02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md)).

## Wann diese Dateien noch relevant sind

- Bestehende **Ableitungen**, die noch ein Hybrid-Schema in Postgres nutzen, koennen die Skripte **manuell** pruefen oder gezielt ausfuehren (nach Backup).
- **Neue** Boilerplate-Instanzen: nicht automatisch anwenden — stattdessen Spacetime-Modul publizieren und `pnpm pull-env` fuer Clerk/Supabase-Bootstrap.

## Inhalt (Kurz)

| Datei                                 | Thema                        |
| ------------------------------------- | ---------------------------- |
| `032_clerk_profiles_support.sql`      | Clerk ↔ `profiles`           |
| `033_user_tenants_fk_to_profiles.sql` | `user_tenants` FK            |
| `034_clerk_org_tenant_mapping.sql`    | Clerk Organizations → Tenant |
| `035_fk_auth_users_to_profiles.sql`   | Auth-User FK                 |
| `036_app_settings_tenant_slug.sql`    | Tenant-Slug in App-Settings  |
