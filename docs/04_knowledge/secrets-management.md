# Secrets Management

## 🎯 Grundprinzip: Single Source of Truth

**Alle API-Keys werden AUSSCHLIESSLICH im Supabase Vault gespeichert.**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  SERVICE_ROLE_KEY     │  SERVICE_ROLE_KEY     │  SERVICE_ROLE_KEY
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     SUPABASE VAULT     │
                    │                        │
                    │
                    │
                    │  OPENAI_API_KEY        │
                    │  HETZNER_CLOUD_TOKEN   │
                    │  ...                   │
                    └────────────────────────┘
```

### ⚠️ WICHTIG: Keine Exchange-Keys in Vercel Env Vars!

Sie werden immer zur Laufzeit aus dem Supabase Vault geladen.

---

## Architektur-Übersicht

Secrets werden in der **Infra-DB (KESSEL)** gespeichert. Siehe auch: [`database-architecture.md`](../02_architecture/database-architecture.md)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EIN-PROJEKT-ARCHITEKTUR                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │            KESSEL-PROJEKT (ufqlocxqizmiaozkashi)           │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │ • Tabellen (profiles, themes, roles, ...)                  │   │
│   │ • Storage (themes bucket)                                  │   │
│   │ • Auth (Supabase Auth)                                     │   │
│   │ • Vault (Secrets) ← Alle Secrets hier!                    │   │
│   │ • MCP aktiv ✓                                              │   │
│   └───────────────────────┬───────────────────────────────────┘   │
│                           │                                         │
│                           ▼                                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  pnpm pull-env  +  Supabase MCP                            │   │
│   │  (Secrets abrufen)  (AI-gesteuert)                         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Projekt    | Project Ref            | Zugriff            | MCP?  |
| ---------- | ---------------------- | ------------------ | ----- |
| **KESSEL** | `ufqlocxqizmiaozkashi` | CLI + MCP + Client | ✅ Ja |

> **Hinweis:** Alle Secrets sind im KESSEL-Projekt Vault gespeichert. Das vereinfacht die Architektur und eliminiert MCP-Token-Probleme.

## Warum ein Projekt?

1. **Vereinfachung**: Keine zwei Projekte mehr zu verwalten
2. **Ein MCP-Token**: Kein Umschalten zwischen Vault und Daten-Projekt
3. **Kosten**: Nutzt nur einen Free-Tier Slot
4. **Isolation**: Vault-Funktionen sind trotzdem sicher (nur service_role Zugriff)

---

## Dateien und Credentials

### `.env` (Bootstrap - KESSEL-Projekt)

```bash
# Bootstrap-Credentials für KESSEL-Projekt
# Wird von pnpm pull-env verwendet, um Secrets aus dem Vault zu holen
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
SERVICE_ROLE_KEY=eyJ...  # KESSEL Service Role Key
```

**Wichtig:**

- Diese Datei ist in `.gitignore` → wird **niemals** committed
- Enthält Credentials für das **KESSEL-Projekt** (Vault + Daten)
- Wird nur vom `pull-env.mjs` Script verwendet

### `.env.local` (Runtime - Generiert)

```bash
# ════════════════════════════════════════════════════════════════════
# Secrets aus Supabase Vault (via pnpm pull-env)
# ════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...  # Public Key für Client
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...
# ... weitere Secrets

# ════════════════════════════════════════════════════════════════════
# Local Development Defaults (automatisch hinzugefügt)
# ════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_AUTH_BYPASS=true
```

**Wichtig:**

- Wird **automatisch generiert** von `pnpm pull-env`
- Enthält alle Secrets aus dem KESSEL-Vault
- **Local Dev Bypass** ist standardmäßig aktiviert - ohne eingeloggten User erfolgt ein Redirect zu `/login`, wo der DevUserSelector (User-Liste) statt des normalen Login-Formulars angezeigt wird
- In `.gitignore` → wird niemals committed

---

## Workflow

### 1. Projekt-Setup (einmalig)

```bash
# 1. .env manuell erstellen mit KESSEL-Credentials
echo "NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co" > .env
echo "SERVICE_ROLE_KEY=eyJ..." >> .env

# 2. Secrets aus KESSEL-Vault holen → .env.local generieren
pnpm pull-env
```

### 2. Tägliche Entwicklung

```bash
# Dev-Server starten (nutzt .env.local automatisch)
pnpm dev

# MCP kommuniziert mit KESSEL-Projekt
# → Tabellen anlegen, Queries ausführen, Secrets verwalten
```

### 3. Bei Secret-Änderungen

```bash
# Wenn Secrets im Vault geändert wurden:
pnpm pull-env  # Aktualisiert .env.local
```

---

## MCP-Konfiguration

### Ein MCP pro Workspace (Governance-Regel)

Dieses Projekt nutzt **genau einen Supabase-MCP**. Er ist immer mit der KESSEL-Datenbank verbunden.

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

**Wichtig:** Keine weiteren Supabase-MCP-Server in diesem Workspace aktivieren!

Cursor hat bekannte Bugs beim Routing von Requests auf mehrere MCP-Instanzen desselben Typs. Diese Architektur umschifft das Problem.

### Andere DBs ansprechen (ohne MCP)

Falls du auf andere Supabase-Datenbanken zugreifen musst:

- **Backend-API-Routes** (`/api/...`)
- **Supabase SDK** (`@supabase/ssr`, `@supabase/supabase-js`)
- **Server-Side Scripts** (`scripts/*.mjs`)

```typescript
// Beispiel: Zugriff auf INFRA-DB ohne MCP
import { createClient } from "@supabase/supabase-js"
const infraClient = createClient(INFRA_URL, INFRA_KEY)
```

Siehe auch: [MCP Governance Rules](../../.cursor/rules/mcp-governance.mdc)

---

## 🚀 Vercel Production Setup

### Erforderliche Environment Variables (minimal)

| Variable                               | Beschreibung                                         | Quelle             |
| -------------------------------------- | ---------------------------------------------------- | ------------------ |
| `SERVICE_ROLE_KEY`                     | **Vault-Zugriff** - der einzige Key für alle Secrets | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase Project URL                                 | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Anon Key                                    | Supabase Dashboard |

| `|`
| `|`

### ❌ NICHT auf Vercel setzen:

- `
- `
- `OPENAI_API_KEY` → Vault
- `GOOGLE_GENERATIVE_AI_API_KEY` → Vault
- Andere Exchange/API Keys → Vault

### Vercel Setup (CLI)

```bash
# Minimale Konfiguration
vercel env add SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add
vercel env add
vercel env add
vercel env add
```

---

## 💻 Lokale Entwicklung (Neuer Rechner)

### Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/phkoenig/your-project.git
cd your-project

# 2. Dependencies installieren
pnpm install

# 3. Bootstrap .env erstellen (manuell)
echo "NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co" > .env
echo "SERVICE_ROLE_KEY=eyJ..." >> .env  # Aus Supabase Dashboard

# 4. Secrets aus Vault holen
pnpm pull-env

# 5. Dev-Server starten
pnpm dev
```

### Was passiert bei `pnpm pull-env`?

1. Liest `SERVICE_ROLE_KEY` aus `.env`
2. Verbindet sich mit Supabase Vault
3. Lädt alle Secrets (Exchange Keys, API Keys, etc.)
4. Schreibt sie in `.env.local`

**Ergebnis:** Alle Secrets sind lokal verfügbar, ohne sie manuell zu kopieren!

---

## 🔒 SERVICE_ROLE_KEY - Kritische Sicherheitsrichtlinien

Der `SERVICE_ROLE_KEY` ist **der mächtigste Schlüssel**. Er hat **vollständigen Zugriff** auf die Datenbank.

### ⚠️ NIEMALS:

1. Im Client-Code verwenden
2. In Git committen
3. Als `NEXT_PUBLIC_*` Variable definieren
4. In Logs ausgeben
5. Exchange-Keys direkt auf Vercel speichern (diese gehören in den Vault!)

### ✅ Nur verwenden in:

- `scripts/pull-env.mjs` (Vault-Zugriff)
- Server-Side API-Routes (`loadExchangeCredentialsByConnector()`)
- Production Environment Variables (nur SERVICE_ROLE_KEY selbst)

---

## Vault-Funktionen

Das KESSEL-Projekt hat folgende Vault-Funktionen:

- `insert_secret(name TEXT, secret TEXT)` - Secret erstellen
- `read_secret(secret_name TEXT)` - Secret lesen
- `delete_secret(secret_name TEXT)` - Secret löschen
- `get_all_secrets_for_env()` - Alle Secrets für `.env.local` exportieren

**Sicherheit:** Alle Funktionen sind nur für `service_role` zugänglich.

---

## Sicherheits-Checkliste

- [ ] `.env` ist in `.gitignore`
- [ ] `.env.local` ist in `.gitignore`
- [ ] `SERVICE_ROLE_KEY` wird nur serverseitig verwendet
- [ ] MCP zeigt auf KESSEL-Projekt
- [ ] Kein Client-Code importiert `SERVICE_ROLE_KEY`

---

## Verifikation

```bash
# Prüfe, ob .env in Git ist (sollte NICHT sein)
git ls-files | grep "\.env$"

# Prüfe .env (KESSEL-Projekt)
grep "supabase.co" .env
# Sollte: ufqlocxqizmiaozkashi (KESSEL) zeigen

# Prüfe .env.local (KESSEL-Projekt)
grep "supabase.co" .env.local
# Sollte: ufqlocxqizmiaozkashi (KESSEL) zeigen

# Teste pull-env
pnpm pull-env
# Sollte erfolgreich sein und .env.local aktualisieren
```

## Vault-Secrets verwalten

| Secret | Beschreibung |
| ------ | ------------ |

| `|`
| `|`
| `|`
| `|`
| `|`

### Infrastruktur-Secrets

| Secret | Beschreibung |
| ------ | ------------ |

**Script zum Aktualisieren:**

```bash
node scripts/save-trading-secrets.mjs
pnpm pull-env
```

Siehe auch: [v1 Infrastruktur-Entscheidung](../02_architecture/v1-infrastructure-decision.md)

### Secret hinzufügen (via MCP)

```sql
SELECT vault.create_secret('SECRET_VALUE', 'SECRET_NAME');
```

### Secret lesen (via MCP - nur service_role)

```sql
SELECT read_secret('SECRET_NAME');
```

### Secret aktualisieren

```sql
-- Altes Secret löschen
SELECT delete_secret('SECRET_NAME');

-- Neues Secret erstellen
SELECT vault.create_secret('NEUER_WERT', 'SECRET_NAME');
```

### Alle Secrets auflisten

```sql
SELECT name, created_at, updated_at
FROM vault.secrets
ORDER BY name;
```

---

## 🔧 Troubleshooting

### "Credentials not found in vault" auf Vercel

**Symptom:** Exchange-API funktioniert lokal, aber nicht auf Vercel (500 Error)

**Prüfe:**

1. **SERVICE_ROLE_KEY auf Vercel gesetzt?**

   ```bash
   vercel env ls | grep SERVICE_ROLE_KEY
   ```

2. **Connector-Name in der DB korrekt?**
   - Muss exakt `kucoin_perpetual` oder `bitget_perpetual` sein
   - Check: `SELECT exchange FROM exchange_accounts;`

3. **Secrets im Vault vorhanden?**

   ```sql
   SELECT name FROM vault.secrets WHERE name LIKE '%PERPETUAL%';
   ```

4. **Debug-Logs auf Vercel prüfen:**
   ```bash
   vercel logs <deployment-url>
   ```
   Suche nach `[Exchange Vault]` Einträgen.

### "SERVICE_ROLE_KEY not configured"

Der Key fehlt in der Umgebung. Prüfe:

- Lokal: `.env` Datei vorhanden mit `SERVICE_ROLE_KEY=...`?
- Vercel: `vercel env ls` zeigt `SERVICE_ROLE_KEY`?

### Secrets nicht aktuell (nach Vault-Änderung)

```bash
# Lokal: Secrets neu laden
pnpm pull-env

# Vercel: Redeploy triggern
vercel --prod
```

---

## ⚠️ Bekannte Fallstricke und Probleme

Diese Sektion dokumentiert Probleme, über die wir gestolpert sind, und ihre Lösungen.

**Problem:**

**Symptom:**

```
(current ip: 34.203.233.200 and current area: US)
```

**Lösung:**
In `vercel.json` die Region auf Frankfurt setzen:

```json
{
  "regions": ["fra1"]
}
```

**Wichtig:** Dies muss für ALLE Projekte mit Exchange-APIs gesetzt werden!

### 2. Trailing Newlines in Vercel Environment Variables

**Problem:**
Wenn Environment Variables über die Vercel UI oder mit `echo` gesetzt werden, können unsichtbare Newline-Zeichen (`\n`) am Ende eingefügt werden.

**Symptom:**

- API-Calls schlagen fehl mit kryptischen Fehlern
- URLs/Keys sehen in der UI korrekt aus, funktionieren aber nicht

**Diagnose:**

```bash
# Hole Variable und zeige Hex-Dump
vercel env pull .env.vercel-check --yes
xxd .env.vercel-check | tail -5
```

**Lösung:**

```bash
# Mit printf statt echo setzen (verhindert Newlines)
printf '%s' "DEIN_WERT" | vercel env add VARIABLE_NAME production
```

### 3. `@t3-oss/env-nextjs` Validierung blockiert Build

**Problem:**
Das `env.mjs` Schema validiert Environment Variables beim Import. Wenn eine Variable als `required` markiert ist, aber auf Vercel fehlt, schlägt der Import fehl - auch für Module, die diese Variable nicht brauchen.

**Symptom:**

- Vercel Build erfolgreich, aber Runtime 500 Errors
- `env.SERVICE_ROLE_KEY` ist `undefined` obwohl Variable gesetzt ist

**Lösung:**

1. `SKIP_ENV_VALIDATION=1` in Vercel Build Env setzen
2. Optionale Variables mit `.optional()` markieren
3. Kritische Variables wie `SERVICE_ROLE_KEY` im `serverSchema` definieren

```typescript
// src/env.mjs
export const serverSchema = z.object({
  SERVICE_ROLE_KEY: z.string().min(1), // Required
  OPENROUTER_API_KEY: z.string().optional(), // Optional
})
```

### 4. Connector-Name Mismatch zwischen DB und Vault

**Problem:**

**Beispiel:**

- DB: `exchange = "kucoin_perpetual"`
- Vault: `
- Aber: `exchange = "kucoin-perpetual"` → `KUCOIN-PERPETUAL_API_KEY` ✗ (nicht gefunden!)

**Lösung:**
Immer Unterstriche verwenden, keine Bindestriche:

- ✓ `kucoin_perpetual`
- ✓ `bitget_perpetual`
- ✗ `kucoin-perpetual`

### 5. SERVICE_ROLE_KEY vs SUPABASE_SERVICE_ROLE_KEY

**Problem:**
Verschiedene Tutorials und Tools verwenden unterschiedliche Namen für denselben Key.

**Lösung:**
Wir verwenden konsistent `SERVICE_ROLE_KEY` (ohne SUPABASE\_ Prefix).

```typescript
// Korrekt
const serviceRoleKey = env.SERVICE_ROLE_KEY

// Falsch (Legacy, nicht verwenden)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔍 Debug-Routes für API-Verifizierung

Für die Diagnose von API-Problemen in Production gibt es spezielle Debug-Routes.

### `/api/debug/vault-test`

Testet den Vault-Zugriff ohne Auth. Zeigt:

- Ob `env` Import funktioniert
- Ob `SERVICE_ROLE_KEY` vorhanden ist
- Ob Vault RPC funktioniert

**Verwendung:**

```bash
curl https://your-project.vercel.app/api/debug/vault-test
```

**Response:**

```json
{
  "vaultRpcSuccess": true,
  "kucoin": {
    "hasApiKey": true,
    "hasSecretKey": true,
    "hasPassphrase": true
  },
  "bitget": { ... }
}
```

### `/api/debug/account-test`

Testet den kompletten Flow: DB → Vault → Exchange API.

**Response:**

```json
{
  "step1Result": "SUCCESS", // Account aus DB
  "step2Result": "SUCCESS", // Credentials aus Vault
  "step3Result": "SUCCESS", // Exchange API Call
  "step4Result": "SUCCESS" // getOpenOrders (oft US-blockiert!)
}
```

### Debugging-Workflow bei Exchange-Problemen

1. **Vault-Test:** `/api/debug/vault-test`
   - Wenn fehlgeschlagen: `SERVICE_ROLE_KEY` prüfen

2. **Account-Test:** `/api/debug/account-test`
   - Step 2 failed: Connector-Name stimmt nicht mit Vault überein
   - Step 3/4 failed: Exchange API Problem (US-Block? Keys falsch?)

3. **Vercel Logs prüfen:**

   ```bash
   vercel logs your-project.vercel.app
   ```

   Suche nach dem genauen API-Fehler.

4. **Region prüfen:**
   - Fehler enthält "US" oder "restricted country"?
   - → `vercel.json` mit `"regions": ["fra1"]` konfigurieren

---

## Migration von Zwei-Projekt-Architektur

Falls du von der alten Zwei-Projekt-Architektur migrierst:

1. Secrets aus altem Vault exportieren (via `pnpm pull-env` mit alter `.env`)
2. Secrets ins KESSEL-Vault importieren (via MCP oder SQL)
3. `.env` auf KESSEL-Projekt umstellen
4. `pnpm pull-env` testen

Siehe auch: [Migration Guide](../06_history/CHANGELOG.md)

---

## Weitere Informationen

- [Supabase Vault Documentation](https://supabase.com/docs/guides/platform/vault)
- [MCP Setup](./mcp-setup.md)
- [Multi-Tenant Architektur](./multi-tenant-architektur.md)
