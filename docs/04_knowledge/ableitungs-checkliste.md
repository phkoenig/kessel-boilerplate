# Checkliste für neue Ableitungen (Boilerplate 2.0)

Für Projekte, die aus dem Kessel-Boilerplate abgeleitet werden.

## Vor Erstellung (kessel init)

- [ ] GitHub-Token bereit (für Repo-Erstellung)
- [ ] Supabase-Projekt(e) angelegt (INFRA + ggf. DEV-DB)
- [ ] Clerk-Projekt angelegt
- [ ] Secrets im Supabase Vault (siehe `.cursor/rules/secrets.mdc`)

## Nach Erstellung

### Clerk

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Vault
- [ ] `CLERK_SECRET_KEY` in Vault
- [ ] `CLERK_WEBHOOK_SIGNING_SECRET` in Vault
- [ ] Webhook in Clerk Dashboard: `/api/webhooks/clerk`
- [ ] `pnpm pull-env` ausgeführt

### Supabase

- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] `SUPABASE_SERVICE_ROLE_KEY` in Vault (nie im Client)
- [ ] Migrationen ausgeführt: `supabase db push` oder Skript

### SpacetimeDB (optional)

- [ ] `NEXT_PUBLIC_SPACETIMEDB_ENABLED=true` wenn verwendet
- [ ] `NEXT_PUBLIC_SPACETIMEDB_URI`, `NEXT_PUBLIC_SPACETIMEDB_DATABASE` gesetzt

### Vercel

- [ ] Projekt mit Vercel verknüpft
- [ ] Env-Variablen aus Vault/Vercel UI gesetzt
- [ ] Build erfolgreich

### Smoke-Tests

- [ ] Login/Logout funktioniert
- [ ] Geschützte Seiten erreichbar
- [ ] Chat-Panel öffnet
- [ ] App-Settings laden (requireAuth)
