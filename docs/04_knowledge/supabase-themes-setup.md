# Supabase Themes Setup

## Übersicht

Die Theme-Verwaltung nutzt Supabase für persistente Speicherung:

- **Metadaten**: `public.themes` Tabelle
- **CSS-Dateien**: `themes` Storage Bucket

## Supabase-Projekt

- **Projekt-ID**: `ufqlocxqizmiaozkashi` (Kessel)
- **URL**: `https://ufqlocxqizmiaozkashi.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/ufqlocxqizmiaozkashi

> **Hinweis:** App-Daten, Auth, Storage **und Vault/Secrets** sind alle im KESSEL-Projekt.

## Environment-Variablen

### Lokal (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Vercel

Setze diese Variablen in den Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL` → Public
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → Public

## Datenbank-Schema

### `public.themes` Tabelle

| Spalte          | Typ         | Beschreibung                              |
| --------------- | ----------- | ----------------------------------------- |
| `id`            | TEXT (PK)   | Theme-ID (z.B. "default", "ocean-breeze") |
| `name`          | TEXT        | Anzeigename                               |
| `description`   | TEXT        | Beschreibung                              |
| `dynamic_fonts` | JSONB       | Array von Google Fonts zum Nachladen      |
| `is_builtin`    | BOOLEAN     | true = kann nicht gelöscht werden         |
| `css_url`       | TEXT        | Optional: Externe CSS-URL                 |
| `created_at`    | TIMESTAMPTZ | Erstellungsdatum                          |
| `updated_at`    | TIMESTAMPTZ | Letzte Änderung                           |

### RLS-Policies

- **SELECT**: Öffentlich lesbar
- **INSERT/UPDATE/DELETE**: Nur für authentifizierte Benutzer

## Storage

### `themes` Bucket

- **Öffentlich**: Ja (für CSS-Laden ohne Auth)
- **Dateiformat**: `{theme-id}.css`
- **Max. Größe**: 1MB
- **MIME-Type**: `text/css`

### Storage-Policies

- **SELECT**: Öffentlich
- **INSERT/UPDATE/DELETE**: Nur authentifizierte Benutzer

## Migration

Die Migration wurde am 2025-12-02 angewendet:

```sql
-- Migration: create_themes_table_and_storage
-- Erstellt themes Tabelle und Storage Bucket
```

## API-Endpunkte

| Endpunkt             | Methode | Beschreibung               |
| -------------------- | ------- | -------------------------- |
| `/api/themes/list`   | GET     | Alle Themes auflisten      |
| `/api/themes/import` | POST    | Neues Theme importieren    |
| `/api/themes/edit`   | PUT     | Theme-Metadaten bearbeiten |
| `/api/themes/delete` | DELETE  | Theme löschen              |

## Theme-Provider

Der `CustomThemeProvider` in `src/lib/themes/theme-provider.tsx`:

1. Lädt Theme-Metadaten von `/api/themes/list`
2. Injiziert `<link>` Tags für dynamische Theme-CSS
3. Setzt `data-theme` Attribut auf `<html>`
4. Lädt dynamische Google Fonts

## Hinweis zu Secrets

Die Secrets (wie `SERVICE_ROLE_KEY`) werden aus dem KESSEL-Projekt Vault geladen via `pnpm pull-env`. Alle Daten (App, Auth, Storage, Vault) sind im selben Projekt (`ufqlocxqizmiaozkashi`).
