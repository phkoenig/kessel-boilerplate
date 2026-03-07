# Boilerplate 3.0 Hard-Cutover Guardrails

## Zweck

Dieses Dokument friert den finalen 3.0-Endzustand fuer die Umsetzung ein. Es beschreibt keine Zwischenarchitektur, sondern die Bedingungen, die vor dem Abschluss des Cutovers zwingend erfuellt sein muessen.

## Finaler Zielzustand

- `Clerk` ist die einzige Quelle fuer Identity, Session und Audience.
- `SpacetimeDB` ist die einzige Boilerplate-Core-DB fuer User-Shadow, Rollen, Permissions, Memberships, Navigation, Wiki, App-Settings, Theme-Metadaten, Chat-Core und Realtime.
- `Supabase` bleibt nur fuer App-Daten und Storage.
- `1Password` ist die einzige Secrets-Quelle fuer lokale Entwicklung, Deployment und CLI-Bootstrap.
- Es existiert genau ein aktiver Supabase-MCP pro Workspace und dieser zeigt auf die App-Supabase.

## Verbotene produktive Runtime-Muster

Diese Muster duerfen im finalen Endzustand nicht mehr als produktive Boilerplate-Core-Pfade existieren:

- `supabase.auth.getUser()` fuer Core-Entscheidungen
- `.from("profiles")` in produktiven Core-, Auth-, Theme-, Rollen-, Wiki- oder Chat-Pfaden
- `.from("roles")` in produktiven Core-, Auth- oder Rollenpfaden
- `.from("module_role_access")` ausserhalb einer expliziten Legacy-Migration
- `.from("app_settings")` fuer Boilerplate-Core-Metadaten
- `.from("themes")` fuer Theme-Metadaten; erlaubt bleiben nur Storage-Asset-Pfade bis zur finalen Verlagerung der Metadaten
- Vault-/RPC-Secrets-Flows statt `op read`
- `legacy-supabase` oder `spacetime-hybrid` als produktiver Endzustand
- `BroadcastChannel` als finale Realtime-Infrastruktur fuer den Boilerplate-Core

## Aktuelle Suchbefehle fuer die Bereinigung

Die folgenden Suchmuster dienen als harte Bereinigungsliste fuer den Cutover:

```bash
rg 'supabase\.auth\.getUser\(' src
rg 'from\("profiles"\)|from\("roles"\)|from\("module_role_access"\)|from\("app_settings"\)|from\("themes"\)' src
rg 'spacetime-hybrid|legacy-supabase|BroadcastChannel' src
rg 'Vault|vault|rpc' scripts src docs .cursor
```

## Dateien mit explizitem Abbaupfad

Diese Dateien markieren den Uebergang und muessen bis zum Abschluss des Cutovers entweder produktiv umgebaut oder aus dem Runtime-Pfad entfernt sein:

- `src/lib/core/index.ts`
- `src/lib/core/spacetime-core-store.ts`
- `src/lib/core/supabase-core-store.ts`
- `src/lib/realtime/spacetime-adapter.ts`
- `scripts/pull-env.mjs`
- `scripts/pull-env.manifest.json`

## Schnittgrenzen fuer die Umsetzung

- Boilerplate-Core-Mutationen laufen ueber Spacetime-Reducer bzw. Procedures.
- App-spezifische CRUD-Operationen laufen weiter ueber die App-Supabase.
- Logos, Favicons, Theme-CSS, PDFs und andere grosse Dateien bleiben in Supabase Storage.
- Theme-, Branding- und Wiki-Metadaten gehoeren in den Spacetime-Core, nicht in die App-DB.
