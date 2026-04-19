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

Es gibt **keine** E-Mail-Allowlist mehr im Anwendungscode. Wer sich bei Clerk registrieren und anmelden darf, steuert du im **Clerk Dashboard** (z. B. Allowed domains, Waitlist, OAuth-Provider).

## Siehe auch

- [ADR-002: Systemgrenzen](../02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md)
- [Secrets Management](./secrets-management.md)
