# Baseline Pre-Boilerplate-2.0

**Stand:** 2025-03-05  
**Zweck:** Referenz für Regressionsmessung vor Migration auf Clerk + SpacetimeDB

## Auth-Status (Ist)

- **Provider:** Supabase Auth
- **Session:** Cookie-basiert über `@supabase/ssr`
- **Guard:** `src/proxy.ts` – leitet unauthentifizierte User auf `/login`
- **Login-UI:** `@supabase/auth-ui-react` in `src/app/(auth)/login/page.tsx`
- **Context:** `src/components/auth/auth-context.tsx` – `auth.getUser()`, `onAuthStateChange`
- **API-Schutz:** Pro-Route manuell, uneinheitlich (teils offen, teils `supabase.auth.getUser()`)

## Realtime-Status (Ist)

- **Kein Realtime-Push:** UI-Updates über fetch-on-mount, Reload, oder Polling
- **Chat:** `window.location.reload()` nach Tool-Calls
- **Kein Supabase Realtime Channel** in produktivem UI

## Multi-Tenancy (Ist)

- **Modell:** Supabase-seitig (`app.tenants`, `app.user_tenants`, `tenant_id` in Domain-Tabellen)
- **RLS:** Tenant-basierte Policies
- **JWT-Claim:** `app.custom_access_token_hook` für `tenant_id`

## Test-Baseline (2025-03-05)

- **Unit/Integration:** 325 passed, 8 failed, 11 skipped (vitest run)
- **Bekannte Failures:** wiki-content (error message), tool-registry (database_id), tool-executor (mock chain), tool-calling-e2e (RLS/update)
- **Setup-Problem:** vitest.setup.ts fehlt für einige Test-Suites (AIInteractable, DetailDrawer, ai-registry-context)
