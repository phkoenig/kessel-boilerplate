# Clerk Production-Instanz

> Plan C-3 (Security & Auth Hardening). Beschreibt die Trennung zwischen
> Development- und Production-Clerk-Instanz und die benoetigten Envs.

## Warum eine separate Production-Instanz?

- **Sauberes User-Directory**: Keine Vermischung von Test-Accounts und
  Live-Usern.
- **Strikte Auth-Policies**: In Production aktivieren wir MFA-Pflicht, strenge
  Password-Rules und Disposable-Email-Block.
- **Key-Isolation**: Leaks in Dev-Keys gefaehrden keine Live-User.
- **SSO-Domains**: Google SSO in Production nur fuer die konfigurierten
  Admin-Domains (`BOILERPLATE_ADMIN_EMAILS`).

## ENV-Struktur (pro Umgebung)

| Variable                            | Development        | Preview          | Production          |
| ----------------------------------- | ------------------ | ---------------- | ------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...`      | `pk_test_...`    | `pk_live_...`       |
| `CLERK_SECRET_KEY`                  | `sk_test_...`      | `sk_test_...`    | `sk_live_...`       |
| `CLERK_WEBHOOK_SIGNING_SECRET`      | dev-Endpoint       | Preview-Endpoint | Prod-Endpoint       |
| `BOILERPLATE_AUTH_BYPASS`           | `true` (opt-in)    | `false`          | **niemals** gesetzt |
| `BOILERPLATE_ADMIN_EMAILS`          | leer / persoenlich | persoenlich      | produktiv           |

Die `pk_live_*` / `sk_live_*`-Varianten werden **nur** in der Vercel-Umgebung
"Production" gesetzt. Zugriff ist auf den Admin-Owner beschraenkt.

## Setup-Schritte (einmalig)

1. Neue Clerk-Application **"Kessel Boilerplate — Production"** anlegen.
2. Unter **Domains** die Live-Domain hinterlegen + HTTPS erzwingen.
3. Unter **SSO Connections** Google aktivieren, Domain-Restriktion einstellen.
4. Unter **Sessions** Session-Lifetime (7 Tage) + Idle-Timeout (2 h) setzen.
5. Webhook-Endpoint `/api/webhooks/clerk` anlegen, Signing-Secret kopieren.
6. `CLERK_WEBHOOK_SIGNING_SECRET` im Vault ablegen, via `pnpm pull-env`
   synchronisieren lassen.
7. Initiale Admins manuell anlegen, dann `BOILERPLATE_ADMIN_EMAILS` in
   Vercel-Prod setzen.

## Go-Live-Checklist

- [ ] `pk_live_*` + `sk_live_*` in Vercel-Prod gesetzt, nicht in Dev/Preview.
- [ ] `BOILERPLATE_AUTH_BYPASS` in Prod **nicht** vorhanden (Check via
      `pnpm security:check`).
- [ ] Webhook-Test aus Clerk-Dashboard liefert 200.
- [ ] `pnpm audit:allowlist` in Prod-Env gruen.
- [ ] Smoke-Test: Login via Google + E-Mail, Logout, Role-Check.
- [ ] Audit-Log (`core_audit_log`) zeigt `user.created`-Eintrag fuer den
      ersten Test-Login.

## Rotation

Rotations-Ablauf fuer Clerk-Secrets: siehe `docs/04_knowledge/secrets-rotation.md`.
