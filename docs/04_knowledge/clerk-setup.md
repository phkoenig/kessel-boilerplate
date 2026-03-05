# Clerk Auth Setup

Ab Boilerplate 2.0 verwendet die App Clerk als primären Auth-Provider.

## Voraussetzungen

1. **Clerk Application** unter [clerk.com](https://clerk.com) anlegen
2. **Keys** aus dem Clerk Dashboard (API Keys):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (publishable)
   - `CLERK_SECRET_KEY` (secret)

## Einrichtung

### 1. Secrets im Supabase Vault ablegen

```bash
# Im Projekt-Root
pnpm supabase secrets set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
pnpm supabase secrets set CLERK_SECRET_KEY="sk_..."
pnpm supabase secrets set CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."  # Fuer Webhook
```

### 2. Env laden

```bash
pnpm pull-env
```

### 3. Webhook konfigurieren (Clerk Dashboard)

- Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Signing Secret in Vault speichern (siehe oben)

## Ohne Clerk konfiguriert

Wenn `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` nicht gesetzt ist, zeigt die App eine Hinweis-Seite mit Setup-Anleitung.
