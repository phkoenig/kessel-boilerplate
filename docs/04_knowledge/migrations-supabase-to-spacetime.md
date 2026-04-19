# Migrations-Guide: Supabase → SpacetimeDB

> **Kontext:** Dieser Guide gehoert zum Plan
> [`260419-boilerplate-db-agnostik.md`](../12_plans/260419-boilerplate-db-agnostik.md)
> und zum ADR
> [`ADR-003-db-agnostic-boilerplate-core.md`](../02_architecture/ADR-003-db-agnostic-boilerplate-core.md).
> Er beschreibt, wie eine bestehende Boilerplate-2.x/3.0-Ableitung, die Themes und
> App-Icons in Supabase (Tabellen + Storage-Buckets) hatte, sauber auf den
> DB-agnostischen 3.x-Kern (Clerk + SpacetimeDB Core + Blob-Storage) migriert wird.

## Was migriert wird

| Quelle (Supabase)                        | Ziel (SpacetimeDB Core)                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| `public.themes` (Metadaten)              | `theme` / `theme_registry` via `coreStore`-Reducer        |
| Storage-Bucket `themes` (CSS-Dateien)    | `blob_asset` (Namespace `themes`, Key `theme-{slug}.css`) |
| Storage-Bucket `app-icons` (Icon-Bilder) | `blob_asset` (Namespace `app-icons`)                      |

**Nicht migriert** werden App-DB-Daten der Beispiel-Features (Bug-Report, Feature-
Wishlist, Datenquellen-Explorer). Diese bleiben in Supabase, weil die Beispiel-Features
Supabase ausdruecklich weiternutzen (siehe ADR-003).

## Voraussetzungen

1. **Supabase-Zugriff (Quelle):**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (oder `SERVICE_ROLE_KEY`)
2. **SpacetimeDB-Ziel:**
   - Laufende `boilerplate-core`-Instanz (`pnpm sdb:publish` falls neu).
   - `NEXT_PUBLIC_SPACETIMEDB_URI`, `NEXT_PUBLIC_SPACETIMEDB_DATABASE`, `SPACETIMEDB_SERVICE_IDENTITY_TOKEN`
     in `.env.local` passend zur publizierten Datenbank.
   - `pnpm generate:spacetime` wurde nach dem letzten Publish ausgefuehrt.
3. **Bindings frisch:** die Reducer `blob_asset_upsert`, `theme_registry_upsert` usw.
   muessen in `src/lib/spacetime/module-bindings` vorhanden sein.

## Ablauf

```bash
# 1) Trockenlauf — zeigt alle geplanten Schritte ohne Schreibzugriff
pnpm migrate:supabase-to-spacetime -- --dry-run

# 2) Kompletter Live-Lauf (Themes + Icons)
pnpm migrate:supabase-to-spacetime

# 3) Selektive Laeufe bei Bedarf
pnpm migrate:supabase-to-spacetime -- --scope themes
pnpm migrate:supabase-to-spacetime -- --scope icons
```

Die Migration ist **idempotent** (alle Schreibzugriffe via `upsert`), d. h. ein zweiter
Lauf veraendert den Endzustand nicht. Das Script protokolliert pro Datensatz
`ok`/`skip`/`error` und endet mit Exit-Code `1`, sobald mindestens eine Quelle fehlte.

## Typische Stolpersteine

- **`caller is not an existing service identity`** → `SPACETIMEDB_SERVICE_IDENTITY_TOKEN`
  fehlt oder zeigt auf eine andere Datenbank. Pruefe, dass `.env.local` exakt die
  `NEXT_PUBLIC_SPACETIMEDB_DATABASE` adressiert, in die gerade publiziert wurde.
- **`no such reducer`** → Bindings sind veraltet. Nach jedem `pnpm sdb:publish` zwingend
  `pnpm generate:spacetime` ausfuehren.
- **Leere Supabase-Credentials** → `tsx` laedt `.env`/`.env.local` automatisch im
  Script; wenn trotzdem nichts kommt, pruefe, ob das Secret in 1Password liegt und
  `pnpm pull-env` gelaufen ist.
- **Blob-Groessenlimit:** das Script verweigert Blobs > 10 MiB und loggt sie als
  `error`. Solche Assets muessen manuell in kleinere Chunks zerlegt oder durch andere
  Varianten ersetzt werden.

## Nach der Migration

1. `NEXT_PUBLIC_SUPABASE_URL` darf in Ableitungen ohne Beispiel-Features entfernt werden.
   Der Boot-Check ([`src/lib/config/boot-check.ts`](../../src/lib/config/boot-check.ts))
   loggt dann neutral "Supabase optional – nicht konfiguriert".
2. Die Navigation blendet `SUPABASE_EXAMPLE_NAV_IDS` automatisch aus
   (`src/lib/navigation/provider.tsx`).
3. Die Theme-UI verwendet ab sofort ausschliesslich `SpacetimeBlobStorage`
   (`src/lib/storage/`). Der `SupabaseBlobStorage`-Adapter bleibt als Legacy-Fallback,
   sollte aber in neuen Kern-Features nicht mehr referenziert werden — die ESLint-Regel
   `local/no-supabase-in-core` erzwingt das.

## Rollback

- Die Quelldaten werden nicht geloescht. Ein Rollback bedeutet lediglich, die
  Spacetime-Eintraege ueber einen eigenen Reducer zu entfernen bzw. `blob_asset`
  selektiv zu leeren und wieder die Supabase-basierte 2.x-UI zu deployen.
- Vor einem Rollback: Snapshot des Spacetime-Moduls (`spacetime-cli dump`) anfertigen.
