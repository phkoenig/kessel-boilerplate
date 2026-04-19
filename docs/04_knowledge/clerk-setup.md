# Clerk Auth (Boilerplate 3.0)

Single-Tenant-Boilerplate: **keine** Clerk Organizations im Code — Identity und Sessions laufen vollstaendig ueber Clerk; User-Shadow und Rollen liegen im **SpacetimeDB-Core** (`getCoreStore()`).

## Voraussetzungen

1. Clerk-Anwendung unter [clerk.com](https://clerk.com) anlegen.
2. Secrets in **1Password** hinterlegen (Felder siehe `scripts/pull-env.manifest.json`).
3. Lokal: `pnpm pull-env` ausfuehren — schreibt u.a.:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - optional `CLERK_WEBHOOK_SIGNING_SECRET` (fuer Produktions-Webhooks)

Die Variablen sind in [`src/env.mjs`](../../src/env.mjs) als **Pflicht** registriert (Ausnahme: `SKIP_ENV_VALIDATION` fuer CI-Builds).

## Routen

| Pfad      | Zweck                            |
| --------- | -------------------------------- |
| `/login`  | `SignIn` (Clerk)                 |
| `/signup` | `SignUp` (Clerk)                 |
| `/verify` | E-Mail-Verifikation (Clerk-Flow) |

`src/proxy.ts` schuetzt alle App-Routen ausser statischen Assets, Webhooks und oeffentlich freigegebenen Pfaden.

## Webhook

- Endpoint: `/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Signing Secret: `CLERK_WEBHOOK_SIGNING_SECRET` (1Password)

Provisioning-Rolle: erster User in der Core-Datenbank wird **Admin**, alle weiteren **User**; bestehende Admin-/Superuser-Rollen werden nicht automatisch heruntergestuft (siehe `resolveBoilerplateProvisioningRole` in `src/lib/auth/provisioning-role.ts`).

## Zugriffskontrolle

Es gibt **keine** Public-Allowlist mehr im Anwendungscode. Wer sich bei Clerk registrieren und anmelden darf, steuert du im **Clerk Dashboard** (z. B. Allowed domains, Waitlist, OAuth-Provider).

Zusaetzlich existiert eine **Admin-Allowlist** (`BOILERPLATE_ADMIN_EMAILS`,
server-only). Jede dort gelistete Email wird beim ersten Login und bei jedem
Sync auf `role: "admin"` gehoben (Plan H-4). Pflege der Liste:

```bash
pnpm audit:allowlist        # Report
pnpm audit:allowlist:fix    # Re-Provisioning aus Allowlist
```

## JWT-Template (Plan H-4)

Damit der schnelle Pfad in `getEmailFromClaims()` greift, muss das Default-JWT
in **Dev- und Prod-Instanz** den Claim `email` ausgeben:

1. Clerk Dashboard → **JWT Templates** → das Default-Template editieren.
2. Custom-Claim hinzufuegen:

   ```json
   {
     "email": "{{user.primary_email_address}}"
   }
   ```

3. Speichern.
4. Manueller Test: nach erneutem Login zeigt
   `await auth().sessionClaims` ein `email`-Feld.

Falls der Claim fehlt, faellt `getAuthenticatedUser` automatisch auf
`clerkClient().users.getUser()` zurueck — Allowlist greift trotzdem, aber mit
zusaetzlichem API-Roundtrip.

## Production vs. Test-Instanz (Plan C-3)

| Umgebung   | Publishable Key | Secret Key  | Webhook                    | Login-URL                         |
| ---------- | --------------- | ----------- | -------------------------- | --------------------------------- |
| Production | `pk_live_…`     | `sk_live_…` | dedizierter Endpoint       | https://&lt;prod-domain&gt;/login |
| Preview    | `pk_test_…`     | `sk_test_…` | Test-Endpoint              | Vercel-Preview-URL                |
| Local Dev  | `pk_test_…`     | `sk_test_…` | – (Webhook lokal optional) | http://localhost:3000/login       |

Detaillierter Go-Live-Runbook: [`clerk-production.md`](./clerk-production.md).

## Siehe auch

- [Rollen-Auflösungs-Matrix](../02_architecture/role-resolution-matrix.md)
- [Audit-Log](../02_architecture/audit-log.md)
- [ADR-002: Systemgrenzen](../02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md)
- [Secrets Management](./secrets-management.md)
- [Clerk Production Setup](./clerk-production.md)
