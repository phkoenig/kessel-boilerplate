# Secrets Management

## Grundprinzip: Single Source of Truth

**Alle API-Keys werden AUSSCHLIESSLICH im Supabase Vault gespeichert.**

**NIEMALS** Secrets manuell in `.env.local` schreiben! Immer via Vault.

## Architektur

Secrets werden in der **Infra-DB (KESSEL)** gespeichert.

| Projekt    | Project Ref            | Zugriff            | MCP?  |
| ---------- | ---------------------- | ------------------ | ----- |
| **KESSEL** | `ufqlocxqizmiaozkashi` | CLI + MCP + Client | ✅ Ja |

---

## Dateien

### `.env` (Bootstrap)

```bash
# Bootstrap-Credentials für KESSEL-Projekt
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
SERVICE_ROLE_KEY=eyJ...
```

- In `.gitignore` - niemals committen
- Wird nur von `pull-env.mjs` verwendet

### `.env.local` (Runtime)

- Automatisch generiert von `pnpm pull-env`
- Enthält alle Secrets aus dem Vault
- In `.gitignore` - niemals committen

---

## Workflow

### Setup (einmalig)

```bash
echo "NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co" > .env
echo "SERVICE_ROLE_KEY=eyJ..." >> .env
pnpm pull-env
```

### Bei Secret-Änderungen

```bash
pnpm pull-env
```

---

## SERVICE_ROLE_KEY Sicherheit

| ❌ NIEMALS               | ✅ NUR in              |
| ------------------------ | ---------------------- |
| Client-Code              | `scripts/pull-env.mjs` |
| Git committen            | Server-Side API-Routes |
| `NEXT_PUBLIC_*` Variable | Production Env Vars    |
| Logs ausgeben            |                        |

---

## Vault-Operationen

Es gibt zwei Methoden, Secrets zum Vault hinzuzufügen:

### Methode 1: REST API (empfohlen für Windows)

```bash
# Hole Service Role Key aus .env.local
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)

# Neues Secret erstellen
curl -X POST "https://ufqlocxqizmiaozkashi.supabase.co/rest/v1/rpc/insert_secret" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "MEIN_SECRET_NAME", "secret": "mein-secret-wert"}'

# Danach: .env.local aktualisieren
pnpm pull-env
```

### Methode 2: psql (für Linux/macOS)

> **WICHTIG:** Das DB-Passwort steht in `.env.local` unter `SUPABASE_DB_PASSWORD`.

#### Verbindung

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2)
DB_HOST="db.ufqlocxqizmiaozkashi.supabase.co"
PGPASSWORD="$DB_PASS" psql -h $DB_HOST -p 5432 -U postgres -d postgres
```

#### Alle Secrets auflisten

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT id, name FROM vault.secrets ORDER BY name;"
```

#### Neues Secret erstellen

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT vault.create_secret('WERT_HIER', 'SECRET_NAME');"
```

#### Secret aktualisieren

**Schritt 1: Secret-ID finden**

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT id, name FROM vault.secrets WHERE name = 'SECRET_NAME';"
```

**Schritt 2: Mit ID aktualisieren**

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT vault.update_secret('UUID_HIER'::uuid, 'NEUER_WERT');"
```

#### Secret löschen

```bash
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT delete_secret('SECRET_NAME');"
```

#### Nach Vault-Änderung

```bash
pnpm pull-env
```

---

## Kompletter Workflow: Neues Secret

### Mit REST API (empfohlen)

```bash
# 1. Service Key holen
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)

# 2. Secret erstellen
curl -X POST "https://ufqlocxqizmiaozkashi.supabase.co/rest/v1/rpc/insert_secret" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "MEIN_SECRET", "secret": "mein-wert"}'

# 3. .env.local aktualisieren
pnpm pull-env

# 4. Verifizieren
grep MEIN_SECRET .env.local
```

### Mit psql

```bash
# 1. Secret erstellen
DB_PASS=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2) && \
PGPASSWORD="$DB_PASS" psql -h db.ufqlocxqizmiaozkashi.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT vault.create_secret('mein-wert', 'MEIN_SECRET');"

# 2. .env.local aktualisieren
pnpm pull-env

# 3. Verifizieren
grep MEIN_SECRET .env.local
```

---

## Troubleshooting

### "duplicate key value violates unique constraint"

Secret existiert bereits → `vault.update_secret()` verwenden.

### "permission denied for table secrets"

Direktes UPDATE nicht erlaubt → Vault-Funktionen verwenden.

### psql nicht installiert

```bash
# Windows (Scoop)
scoop install postgresql

# macOS
brew install postgresql

# Ubuntu
sudo apt install postgresql-client
```

---

## MCP-Konfiguration

Ein MCP pro Workspace - immer KESSEL:

```json
{
  "mcpServers": {
    "supabase_KESSEL": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=ufqlocxqizmiaozkashi"
    }
  }
}
```
