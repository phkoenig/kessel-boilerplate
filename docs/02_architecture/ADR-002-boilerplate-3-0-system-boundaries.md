# ADR-002: Boilerplate 3.0 System Boundaries

## Status

Accepted

## Kontext

Boilerplate 2.x hat Auth, Core-Metadaten, Realtime, Assets und Secrets stark um Supabase herum gebuendelt. Das fuehrte in Ableitungen zu unklaren Grenzen:

- Auth-/Rollenlogik und App-Daten lagen im selben Backend-Scope.
- Secrets waren an Supabase Vault gekoppelt, obwohl sie fuer lokale Setups und Agenten globaler gedacht sind.
- Realtime war vorhanden, aber nicht als zentrale Boilerplate-Core-Schicht modelliert.
- MCP- und CLI-Setups waren an mehrdeutige Supabase-Rollenbilder gekoppelt.

## Entscheidung

Boilerplate 3.0 folgt einer festen Vierer-Aufteilung:

- `Clerk`: Identity, Sessions, Audience, Organizations.
- `SpacetimeDB Core`: Boilerplate-Core fuer User-Shadow, Rollen, Permissions, Navigation, Wiki, Chat-State, Notifications, App-Metadaten und Realtime.
- `Supabase`: App-DB und Storage fuer fachliche Daten, Dateien, Bilder, PDFs, Buckets und Signed URLs.
- `1Password`: zentrale Secrets-Quelle fuer `pull-env`, lokale Entwicklung und Deployment-Weitergabe.

## Datenklassifikation

### Core Entities

Liegen im Boilerplate-Core und gehoeren nicht in die App-DB:

- User-Shadow und Clerk-Mapping
- Rollen, Permissions, Memberships
- Navigation, Wiki, Notifications
- Chat-Threads, Chat-Messages, Drafts, Tool-Progress
- App-Settings, Theme-Metadaten, Workspace-State

### App Domain Data

Liegen in der App-Supabase:

- Fachliche Tabellen pro Ableitung
- Projektdaten, Objekte, Kunden-/Businessdaten
- alle schemaspezifischen App-Modelle

### Assets And Files

Bleiben in Supabase Storage:

- App-Logos, Favicon-Quellen, Theme-CSS
- PDFs, Plaene, Bilder, Exporte, Previews

### Secrets

Werden nicht mehr in Supabase Vault als Boilerplate-Standard gehalten:

- Runtime-Secrets leben in 1Password
- `pnpm pull-env` zieht sie ueber `op read`
- `.env.local` bleibt generiert und unversioniert

## Konsequenzen

- Neue Boilerplate-Pfade sprechen ausschliesslich ueber `src/lib/core/*` und den produktiven Spacetime-Core.
- Es gibt pro Workspace genau einen Supabase-MCP, der auf die App-Supabase zeigt.
- `pull-env` und CLI-Prechecks behandeln 1Password als Pflicht-Baustein.
- Storage bleibt in Supabase, auch wenn Boilerplate-Core-Entitaeten nach Spacetime verlagert werden.
- `profiles`, `roles`, `module_role_access`, `app_settings` und Theme-Metadaten sind keine produktiven Core-Tabellen mehr.

## Hard-Cutover-Regeln

Folgende Aussagen muessen im finalen 3.0-Zustand wahr sein:

- Es gibt keine produktiven Hybrid- oder Legacy-Core-Runtime-Pfade mehr.
- `src/lib/core/index.ts` verdrahtet produktiv nur noch den echten Spacetime-Store.
- `src/lib/core/supabase-core-store.ts` ist hoechstens noch Migrationshilfe, aber kein aktiver Runtime-Pfad.
- `src/lib/realtime/spacetime-adapter.ts` spricht mit echter Spacetime-Connection und nicht mit `BroadcastChannel`-Mocks.
- `supabase.auth.getUser()` wird nicht mehr fuer Boilerplate-Core-Entscheidungen genutzt; Identity kommt von Clerk.
- Supabase bleibt nur fuer App-Daten, Buckets, Assets, Signed URLs, Uploads und Previews zustaendig.

## Repo-weite Suchliste fuer verbotene Endzustandsmuster

Vor Abschluss des Cutovers muessen diese Muster aus produktiven Core-Pfaden verschwinden:

- direkte Reads/Writes gegen `profiles`
- direkte Reads/Writes gegen `roles`
- direkte Reads/Writes gegen `module_role_access`
- direkte Reads/Writes gegen `app_settings`
- direkte Reads/Writes gegen `themes`, soweit es Theme-Metadaten und nicht Storage-Assets betrifft
- `supabase.auth.getUser()` in Core-, Auth-, Theme-, Navigation-, Wiki- und Chat-Pfaden
- Vault-/RPC-Secrets-Flows statt `op read`
