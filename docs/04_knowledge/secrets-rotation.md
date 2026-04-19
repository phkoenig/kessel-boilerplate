# Secrets Rotation Playbook

> Plan X-3 (Security & Auth Hardening). Dieses Dokument beschreibt die
> Rotations-Prozeduren fuer alle produktiven Secrets.

## Grundregeln

- Secrets leben **ausschliesslich** im Supabase Vault (siehe Secrets-Policy
  `user_rule` → "Secrets & Environment Management").
- `.env` enthaelt nur **Bootstrap-Creds**. Rest wird via `pnpm pull-env`
  synchronisiert.
- Keine Rotation ohne Audit-Eintrag (`core_audit_log`, manuell oder via Script).
- Rotationen werden in einem Change-Log-Commit auf `main` dokumentiert.

## Rotations-Matrix

| Secret                          | Quelle             | Rotations-Rhythmus               | Owner          |
| ------------------------------- | ------------------ | -------------------------------- | -------------- |
| `CLERK_SECRET_KEY`              | Clerk-Dashboard    | 90 Tage oder bei Personalwechsel | Auth-Owner     |
| `CLERK_WEBHOOK_SIGNING_SECRET`  | Clerk-Dashboard    | bei Endpoint-Change              | Auth-Owner     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase-Dashboard | 180 Tage                         | Data-Owner     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-Dashboard | 365 Tage                         | Data-Owner     |
| `OPENROUTER_API_KEY`            | OpenRouter-Account | 180 Tage                         | AI-Owner       |
| `SPACETIMEDB_AUTH_TOKEN`        | Spacetime CLI      | bei Personalwechsel              | Platform-Owner |
| `BOILERPLATE_ADMIN_EMAILS`      | Vercel-Env         | bei Personalwechsel              | Admin-Owner    |

## Ablauf: Normale Rotation

1. Neues Secret im Upstream-Dashboard generieren.
2. Supabase-Vault aktualisieren (`pnpm pull-env` erwartet den neuen Wert).
3. Vercel-Env-Variable updaten (Production + Preview separat).
4. Deployment ausloesen, verifizieren (Smoke-Tests).
5. Altes Secret im Upstream **revoken**.
6. Change-Log-Commit: `chore(secrets): rotate <name>` + Audit-Eintrag via
   `recordAudit("secret.rotated", "secret", "<name>")`.

## Ablauf: Incident-Rotation

Bei Verdacht auf Leak:

1. Secret im Upstream **sofort revoken** (vor dem Austausch).
2. Neues Secret generieren, Vault + Vercel aktualisieren.
3. Deployment erzwingen (`vercel --prod --force`).
4. Access-Logs/Audit-Log auf Auffaelligkeiten pruefen.
5. Post-Mortem im `docs/06_history/` anlegen.

## Automatisierung

- `pnpm security:check` scannt das Repo auf bekannte Anti-Patterns
  (`NEXT_PUBLIC_AUTH_BYPASS`, etc.).
- `pnpm pull-env` verifiziert, dass alle erwarteten Secrets vorhanden sind.
- `scripts/audit-admin-allowlist.mjs` prueft die `BOILERPLATE_ADMIN_EMAILS`
  gegen den tatsaechlichen User-Bestand.

## Verantwortlichkeiten

- Rotation ohne Handover: nicht erlaubt. Jede Rotation wird durch mindestens
  eine zweite Person reviewt (Four-Eyes).
- Bei Personalwechsel werden **alle** Secrets rotiert, die der ausscheidende
  Account kannte.
