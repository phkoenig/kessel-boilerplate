# Supabase Setup

Dieses Verzeichnis enthält SQL-Migrationen für die Supabase-Datenbank.

## Vault Setup (Erforderlich für Secrets Management)

### Schritt 1: Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Notiere dir die folgenden Werte:
   - `NEXT_PUBLIC_SUPABASE_URL` (z.B. `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/public key)
   - `SERVICE_ROLE_KEY` (service_role key - **NIEMALS im Client-Code verwenden!**)

### Schritt 2: Vault-Funktionen installieren

1. Öffne den SQL Editor in deinem Supabase Dashboard
2. Kopiere den Inhalt von `migrations/001_vault_setup.sql`
3. Führe das SQL-Skript aus

**Wichtig:** Das Skript erstellt:

- Die Vault-Extension
- 4 Vault-Funktionen (`insert_secret`, `read_secret`, `delete_secret`, `get_all_secrets_for_env`)
- REVOKE-Statements für Sicherheit

### Schritt 3: Secrets hinzufügen

Nach der Installation kannst du Secrets hinzufügen:

```sql
-- Beispiel: Secret hinzufügen
SELECT insert_secret('STRIPE_SECRET_KEY', 'sk_live_...');
SELECT insert_secret('OPENAI_API_KEY', 'sk-...');
```

**Wichtig:** Diese Funktionen können nur mit `service_role` aufgerufen werden!

### Schritt 4: Secrets testen

```sql
-- Alle Secrets abrufen (nur mit service_role)
SELECT get_all_secrets_for_env();

-- Einzelnes Secret abrufen
SELECT read_secret('STRIPE_SECRET_KEY');
```

## Verwendung im Projekt

Nach dem Setup kannst du Secrets mit dem `pull-env` Skript abrufen:

```bash
# Stelle sicher, dass .env die Bootstrap-Credentials enthält:
# NEXT_PUBLIC_SUPABASE_URL=...
# SERVICE_ROLE_KEY=...

# Dann:
pnpm pull-env
```

Das Skript ruft alle Secrets aus dem Vault ab und schreibt sie in `.env.local`.
