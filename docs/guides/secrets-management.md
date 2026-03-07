# Secrets Management

## Grundprinzip: Single Source of Truth

**Alle Runtime-Secrets werden AUSSCHLIESSLICH in 1Password gespeichert.**

**NIEMALS** Secrets manuell in `.env.local` schreiben! Immer via `pnpm pull-env`.

## Architektur

Secrets werden in **1Password** gepflegt und lokal ueber die 1Password CLI (`op`) gelesen.

| System          | Rolle                                   |
| --------------- | --------------------------------------- |
| `1Password`     | Single Source of Truth fuer Secrets     |
| `pnpm pull-env` | Generiert `.env.local` fuer lokale Runs |
| `.env`          | Bootstrap-Werte + optionale `OP_REF_*`  |

---

## Dateien

### `.env` (Bootstrap)

```bash
# Bootstrap fuer die aktuelle Ableitung
NEXT_PUBLIC_SUPABASE_URL=https://dein-app-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_TENANT_SLUG=dein_projekt

# Optional: abweichende 1Password-Referenzen
OP_REF_SUPABASE_SERVICE_ROLE_KEY=op://Kessel Boilerplate/App Runtime/SUPABASE_SERVICE_ROLE_KEY
```

- In `.gitignore` - niemals committen
- Wird nur von `pull-env.mjs` verwendet

### `.env.local` (Runtime)

- Automatisch generiert von `pnpm pull-env`
- Enthält Bootstrap-Werte, 1Password-Secrets und lokale Defaults
- In `.gitignore` - niemals committen

---

## Workflow

### Setup (einmalig)

```bash
echo "NEXT_PUBLIC_SUPABASE_URL=https://dein-app-projekt.supabase.co" > .env
echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_..." >> .env
echo "NEXT_PUBLIC_TENANT_SLUG=dein_projekt" >> .env
pnpm pull-env
```

### Setup pro Rechner

Ja: Auf jedem neuen Rechner musst Du den 1Password-CLI-Flow einmal sauber einrichten.

Das ist der empfohlene stabile Weg fuer Boilerplate 3.0:

```bash
# 1. CLI im PATH verfuegbar machen
export PATH="$PATH:/c/Users/<user>/AppData/Local/Microsoft/WinGet/Links"

# 2. Desktop-Popup-Schleifen deaktivieren
export OP_BIOMETRIC_UNLOCK_ENABLED=false

# 3. Account einmalig manuell fuer die CLI hinterlegen
op account add --address my.1password.eu --email <deine-mail> --shorthand kessel

# 4. Danach pro Terminal-Session einloggen
export OP_ACCOUNT=kessel
export OP_SESSION_kessel="$(op signin --account kessel --raw)"

# 5. Session pruefen
op vault list
```

Wichtige Praxisregel:

- `op account add` ist in der Regel **pro Rechner einmalig**
- `op signin --raw` ist **pro Terminal-Session** bzw. nach Session-Ablauf erneut noetig
- wenn `op vault list` funktioniert, sollte auch `pnpm pull-env` stabil laufen
- vermeide fuer Automatisierung die dauernde Desktop-Integration mit Popup-Fenstern, wenn sie in eine Schleife kippt

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
| Logs ausgeben            | 1Password/Vercel       |

---

## 1Password-Operationen

### Neues Secret oder Feld anlegen

```bash
# Secret oder Feld in 1Password anlegen
# Optional die Referenz ueber OP_REF_<NAME> in .env ueberschreiben
# Danach .env.local neu erzeugen
pnpm pull-env
```

### Erwartete Vault-Struktur fuer Boilerplate 3.0

Standardmaessig erwartet `scripts/pull-env.manifest.json` den Vault `Kessel Boilerplate` mit diesen Items:

- `App Runtime`
- `AI Runtime`
- `Auth Runtime`
- `Spacetime Runtime`

Typische Felder darin:

- `App Runtime`: `SUPABASE_SERVICE_ROLE_KEY`
- `AI Runtime`: `OPENROUTER_API_KEY`, optional `FAL_API_KEY`
- `Auth Runtime`: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `Spacetime Runtime`: `NEXT_PUBLIC_SPACETIMEDB_URI`, `NEXT_PUBLIC_SPACETIMEDB_DATABASE`

Optionale Felder duerfen fehlen. `pnpm pull-env` ueberspringt sie im finalen 3.0-Flow.

## Historischer Hinweis

Fruehere Boilerplate-Versionen nutzten Supabase Vault. Dieser Guide dokumentiert fuer Boilerplate 3.0 bewusst den 1Password-Flow; verbleibende Vault-Skripte gelten nur noch fuer Legacy-Projekte.

---

## Troubleshooting

### `op` nicht gefunden

Installiere die 1Password CLI und pruefe die Anmeldung:

```bash
op --version
op account list
```

### 1Password fragt immer wieder nach dem Passwort

Das passiert typischerweise, wenn die Desktop-Integration jeden `op`-Subprozess separat autorisiert und die Freigabe nicht stabil cached.

Empfohlene Loesung:

```bash
export OP_BIOMETRIC_UNLOCK_ENABLED=false
op account add --address my.1password.eu --email <deine-mail> --shorthand kessel
export OP_ACCOUNT=kessel
export OP_SESSION_kessel="$(op signin --account kessel --raw)"
op vault list
```

Wenn `op vault list` funktioniert, nutze denselben Terminal-Kontext fuer `pnpm pull-env`.

### `pull-env` findet eine Referenz nicht

- Pruefe die `OP_REF_*` Overrides in `.env`
- pruefe die Standardreferenzen in `scripts/pull-env.manifest.json`
- fuehre danach erneut `pnpm pull-env` aus

### `Bootstrap-Variable fehlt: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Im Bootstrap reicht es, wenn einer dieser beiden Werte vorhanden ist:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`pull-env` spiegelt diese beiden Namen gegenseitig, damit alte und neue Projekte gleichermassen funktionieren.

### Optionales Secret fehlt in 1Password

Beispiel:

```text
Command failed: op read op://Kessel Boilerplate/AI Runtime/FAL_API_KEY
```

Wenn das Feld optional ist, wird es von `pnpm pull-env` uebersprungen. Nur Pflichtfelder muessen im Vault existieren.

### `.env.local` enthaelt veraltete Werte

```bash
rm .env.local
pnpm pull-env
```

---

## MCP-Konfiguration

Ein MCP pro Workspace - immer die aktive App-Supabase:

```json
{
  "mcpServers": {
    "app_supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=PROJECT_REF"
    }
  }
}
```
