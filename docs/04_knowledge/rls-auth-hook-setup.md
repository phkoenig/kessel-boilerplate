# RLS Auth Hook Setup

Der Auth Hook injiziert `tenant_id` in JWT Claims beim Login.

## Voraussetzung

- Migration 009 (`009_rls_tenant_setup.sql`) angewendet
- User in `app.user_tenants` eingetragen

## Konfiguration

1. Dashboard → **Authentication** → **Hooks**
2. **Custom Access Token** → **Enable Hook**
3. **Hook Type**: `Postgres Function`
4. **Schema**: `app`
5. **Function Name**: `custom_access_token_hook`
6. **Save**

## Verifizierung

Nach Login sollte der JWT enthalten:

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "authenticated"
}
```

## Troubleshooting

| Problem                    | Lösung                                 |
| -------------------------- | -------------------------------------- |
| tenant_id fehlt            | User in `app.user_tenants` eintragen   |
| Hook wird nicht aufgerufen | Hook-Konfiguration im Dashboard prüfen |
| Funktion nicht gefunden    | Migration 009 prüfen                   |

## Referenz

- [Supabase Auth Hooks Docs](https://supabase.com/docs/guides/auth/auth-hooks)
