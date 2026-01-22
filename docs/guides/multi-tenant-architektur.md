# Multi-Tenant Architektur (RLS-basiert)

## Konzept

Alle Kessel-Projekte teilen sich **ein Supabase-Projekt** mit Tenant-Isolation via Row Level Security (RLS).

**Projekt**: `ufqlocxqizmiaozkashi` (Kessel)

## Datenstruktur

```
app.tenants          → Tenant-Metadaten (id, slug, name)
app.user_tenants     → User-Tenant-Zuordnung (N:M, mit role)
public.* Tabellen    → Alle haben tenant_id Spalte
```

## Funktionsweise

1. **Auth Hook** injiziert `tenant_id` in JWT beim Login
2. **RLS Policies** erzwingen `tenant_id = app.current_tenant_id()`
3. **Automatische Filterung** - keine explizite tenant_id Angabe in Queries nötig

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_TENANT_SLUG=galaxy
```

> `NEXT_PUBLIC_PROJECT_SCHEMA` ist veraltet → `NEXT_PUBLIC_TENANT_SLUG` verwenden

## Supabase Client

```typescript
// Kein db.schema Override - RLS übernimmt Isolation
const client = createBrowserClient(url, key)
```

## Neues Projekt

```bash
npx kessel init
```

## Setup

1. **Auth Hook aktivieren**: Dashboard → Authentication → Hooks → Custom Access Token
   - Type: `Postgres Function`, Schema: `app`, Function: `custom_access_token_hook`

## Troubleshooting

| Problem                     | Lösung                                  |
| --------------------------- | --------------------------------------- |
| User sieht keine Daten      | Prüfe `app.user_tenants` und Auth Hook  |
| tenant_id fehlt im JWT      | Auth Hook aktivieren                    |
| Daten-Leak zwischen Tenants | Prüfe RLS Policies und tenant_id Spalte |

## Referenzen

- [Auth Hook Setup](rls-auth-hook-setup.md)
- [Testing Guide](rls-testing-guide.md)
- [Migration Guide](tenant-migration-guide.md)
