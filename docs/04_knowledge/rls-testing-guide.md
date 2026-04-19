# RLS Testing Guide

## Schnelltest

```bash
node scripts/test-tenant-setup.mjs
```

**Testet:**

- Tenant-Erstellung (RPC)
- User-Tenant-Zuordnung
- JWT Claims (tenant_id)
- RLS Isolation

## Voraussetzungen

### 1. Migrationen

```bash
supabase db push
supabase migration list --linked
```

### 2. PostgREST Exposed Schemas

Dashboard → Settings → API → **Exposed schemas**: `public, infra, app, ...`

### 3. Auth Hook

Dashboard → Authentication → Hooks → Custom Access Token:

- Type: `Postgres Function`
- Schema: `app`
- Function: `custom_access_token_hook`

## Erwartete Ausgabe

```
✅ Alle Tests erfolgreich!

📝 Zusammenfassung:
   - Tenant erstellt: <uuid>
   - User erstellt: <uuid>
   - JWT Claims: ✓ (tenant_id vorhanden)
   - RLS Isolation: ✓
```

## Troubleshooting

| Fehler                        | Lösung                                         |
| ----------------------------- | ---------------------------------------------- |
| `PGRST002` Schema Cache       | Warte 2-5 Min, prüfe Exposed schemas           |
| `PGRST202` Function not found | `infra` zu Exposed schemas hinzufügen          |
| tenant_id fehlt im JWT        | Auth Hook prüfen, User-Tenant-Zuordnung prüfen |
| infinite recursion            | Migration 017 anwenden                         |

## Manuelle SQL-Checks

```sql
-- Tenant existiert?
SELECT * FROM app.tenants WHERE slug = 'galaxy';

-- User zugeordnet?
SELECT * FROM app.user_tenants WHERE user_id = '<uuid>';

-- current_tenant_id() funktioniert?
SELECT app.current_tenant_id();
```

## Referenzen

- [Multi-Tenant Architektur](multi-tenant-architektur.md)
- [Auth Hook Setup](rls-auth-hook-setup.md)
