# Initial Setup Guide

Dieser Guide beschreibt die vollständige Einrichtung der Boilerplate nach dem Klonen des Repositories.

## Schritt-für-Schritt Anleitung

### 1. Dependencies installieren

```bash
pnpm install
```

### 2. Environment-Variablen einrichten

#### 2.1 Vault-Credentials (.env)

Erstelle eine `.env` Datei im Projekt-Root mit den Credentials für dein Supabase Vault-Projekt:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<vault-project>.supabase.co
SERVICE_ROLE_KEY=<vault-service-role-key>
```

#### 2.2 Secrets aus Vault laden

```bash
pnpm pull-env
```

Dies lädt alle Secrets aus dem Supabase Vault und schreibt sie in `.env.local`.

### 3. Supabase Datenbank Setup

#### 3.1 Migrationen ausführen

```bash
npx supabase db push
```

Dies führt alle Migrationen aus dem `supabase/migrations/` Verzeichnis aus.

#### 3.2 Themes Storage Bucket erstellen

Siehe: [Supabase Themes Setup](supabase-themes-setup.md)

### 4. Test-User anlegen

```bash
pnpm setup
```

Dieses Script:

- Legt drei Standard Test-User an
- Setzt die Rollen korrekt in der `profiles`-Tabelle
- Deaktiviert Email-Bestätigung für Development

#### Standard Test-User

| Rolle     | E-Mail-Adresse       | Passwort    | Beschreibung                                         |
| --------- | -------------------- | ----------- | ---------------------------------------------------- |
| **Admin** | `admin@kessel.local` | `Admin123!` | Vollzugriff auf alle Bereiche, inkl. User-Verwaltung |
| **User**  | `user@kessel.local`  | `User123!`  | Standard-User mit eingeschränkten Rechten            |
| **Test**  | `test@kessel.local`  | `Test123!`  | Zusätzlicher Test-Account                            |

**⚠️ KRITISCH:** Diese Test-User sind nur für die Entwicklung gedacht und müssen in Production geändert oder gelöscht werden!

### 5. Dev-Server starten

```bash
pnpm dev
```

Die App läuft dann auf `http://localhost:3000`.

## Login testen

1. Öffne `http://localhost:3000/login`
2. Verwende eine der Test-User Credentials (z.B. `admin@kessel.local` / `Admin123!`)
3. Nach erfolgreichem Login wirst du zur Home-Seite weitergeleitet

## Nächste Schritte

- [ ] Test-User Passwörter ändern oder löschen (für Production)
- [ ] Eigene Themes importieren (siehe [Supabase Themes Setup](supabase-themes-setup.md))
- [ ] Navigation anpassen (`src/config/navigation.ts`)
- [ ] Module und Submodule konfigurieren (`src/config/shell.ts`)

## Troubleshooting

### Test-User können sich nicht einloggen

- Prüfe ob `pnpm setup` erfolgreich ausgeführt wurde
- Prüfe ob Email-Bestätigung deaktiviert ist (Supabase Dashboard > Authentication > Settings)
- Prüfe ob die Rollen in der `profiles`-Tabelle korrekt gesetzt sind

### Migrationen schlagen fehl

- Stelle sicher, dass du mit dem richtigen Supabase-Projekt verlinkt bist: `supabase projects list`
- Prüfe ob alle Environment-Variablen gesetzt sind
- Prüfe die Supabase Logs im Dashboard

### Secrets werden nicht geladen

- Prüfe ob `.env` die Vault-Credentials enthält
- Prüfe ob `pnpm pull-env` erfolgreich ausgeführt wurde
- Prüfe ob die Secrets im Supabase Vault existieren

### Login schlägt mit 400 (Invalid API key) fehl

**Symptom:** curl funktioniert, aber Browser-Login schlägt fehl.

**Ursache:** Der `NEXT_PUBLIC_SUPABASE_ANON_KEY` im Vault zeigt auf ein falsches Projekt.

**Diagnose:**

```bash
# JWT dekodieren und Projekt-Ref prüfen
grep ANON_KEY .env.local | cut -d= -f2 | cut -d. -f2 | base64 -d | grep -o '"ref":"[^"]*"'
# Muss "ref":"ufqlocxqizmiaozkashi" zeigen
```

**Lösung:** Vault-Secret korrigieren mit SQL (via Supabase MCP auf Vault-Projekt):

```sql
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  '<KORREKTER_KEY>',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);
```

Dann `pnpm pull-env` und `rm -rf .next && pnpm dev`.
