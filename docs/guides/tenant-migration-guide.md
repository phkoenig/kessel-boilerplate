# Migration: Schema → RLS-Tenant

Für Projekte mit `NEXT_PUBLIC_PROJECT_SCHEMA` (vor Dezember 2024).

## Automatisch

```bash
node scripts/migrate-schema-to-tenant.mjs <slug> "<name>"

# Beispiele:
node scripts/migrate-schema-to-tenant.mjs galaxy "Galaxy App"
node scripts/migrate-schema-to-tenant.mjs treebuilder "TreeBuilder"
```

Das Script:

1. Erstellt Tenant in `app.tenants`
2. Ordnet Standard-User zu
3. Setzt `tenant_id` in bestehenden Daten

## Manuelle Schritte danach

### 1. `.env.local` anpassen

```diff
- NEXT_PUBLIC_PROJECT_SCHEMA=galaxy
+ NEXT_PUBLIC_TENANT_SLUG=galaxy
```

### 2. Supabase Client prüfen

```typescript
// ENTFERNEN: db: { schema: ... }
const client = createBrowserClient(url, key)
```

### 3. Auth Hook aktivieren (falls noch nicht)

Dashboard → Authentication → Hooks → Custom Access Token

## Checkliste

- [ ] Migration-Script ausgeführt
- [ ] `.env.local` aktualisiert
- [ ] Supabase Client ohne Schema-Override
- [ ] Auth Hook aktiv
- [ ] `node scripts/test-tenant-setup.mjs` erfolgreich

## Referenzen

- [Multi-Tenant Architektur](multi-tenant-architektur.md)
- [Testing Guide](rls-testing-guide.md)
