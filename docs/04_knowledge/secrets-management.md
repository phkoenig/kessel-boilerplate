# Secrets Management - Zwei-Projekt-Architektur

## Architektur-Übersicht

Dieses Projekt verwendet **zwei separate Supabase-Projekte** für maximale Sicherheit:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ZWEI-PROJEKT-ARCHITEKTUR                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────┐         ┌─────────────────────┐          │
│   │   VAULT-PROJEKT     │         │   KESSEL-PROJEKT    │          │
│   │   (zedhieyjlf...)   │         │   (ufqlocxqi...)    │          │
│   ├─────────────────────┤         ├─────────────────────┤          │
│   │ • Secrets speichern │         │ • Tabellen          │          │
│   │ • Nur CLI-Zugriff   │         │ • Storage           │          │
│   │ • Kein MCP!         │         │ • Auth              │          │
│   │                     │         │ • MCP aktiv ✓       │          │
│   └──────────┬──────────┘         └──────────┬──────────┘          │
│              │                               │                      │
│              ▼                               ▼                      │
│   ┌─────────────────────┐         ┌─────────────────────┐          │
│   │  pnpm pull-env      │         │  Supabase MCP       │          │
│   │  (einmalig/selten)  │         │  (AI-gesteuert)     │          │
│   └─────────────────────┘         └─────────────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Projekt            | Project Ref            | Zugriff               | MCP?  |
| ------------------ | ---------------------- | --------------------- | ----- |
| **Vault**          | `zedhieyjlfhygsfxzbze` | CLI (`pnpm pull-env`) | ✅ Ja |
| **Daten (KESSEL)** | `ufqlocxqizmiaozkashi` | MCP + Client          | ✅ Ja |

> **Hinweis:** Beide Projekte haben MCP-Zugriff. Der Vault wird für Secrets verwendet,
> KESSEL für App-Daten, Auth und Storage.

## Warum zwei Projekte?

1. **Sicherheit**: Vault-Secrets sind vom Haupt-Backend isoliert
2. **Minimale Angriffsfläche**: Vault wird nur via CLI angesprochen
3. **Kontext-Effizienz**: Nur ein MCP = weniger Token-Verbrauch
4. **Klare Trennung**: Infrastruktur (Vault) vs. Entwicklung (Daten)

---

## Dateien und Credentials

### `.env` (Bootstrap - Vault-Projekt)

```bash
# Bootstrap-Credentials für VAULT-Projekt
# Wird nur von pnpm pull-env verwendet
NEXT_PUBLIC_SUPABASE_URL=https://zedhieyjlfhygsfxzbze.supabase.co
SERVICE_ROLE_KEY=eyJ...  # Vault Service Role Key
```

**Wichtig:**

- Diese Datei ist in `.gitignore` → wird **niemals** committed
- Enthält Credentials für das **Vault-Projekt** (nicht Daten!)
- Wird nur vom `pull-env.mjs` Script verwendet

### `.env.local` (Runtime - KESSEL-Projekt)

```bash
# Generiert von: pnpm pull-env
# Credentials für KESSEL-Projekt (App-Daten + Auth)
NEXT_PUBLIC_SUPABASE_URL=https://ufqlocxqizmiaozkashi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...      # Public Key für Client
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ... # Alias für ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-only, niemals im Client!
```

**Wichtig:**

- Wird **automatisch generiert** von `pnpm pull-env`
- Enthält Credentials für das **Daten-Projekt**
- In `.gitignore` → wird niemals committed

---

## Workflow

### 1. Projekt-Setup (einmalig)

```bash
# 1. .env manuell erstellen mit Vault-Credentials
echo "NEXT_PUBLIC_SUPABASE_URL=https://zedhieyjlfhygsfxzbze.supabase.co" > .env
echo "SERVICE_ROLE_KEY=eyJ..." >> .env

# 2. Secrets aus Vault holen → .env.local generieren
pnpm pull-env
```

### 2. Tägliche Entwicklung

```bash
# Dev-Server starten (nutzt .env.local automatisch)
pnpm dev

# MCP kommuniziert mit Daten-Projekt
# → Tabellen anlegen, Queries ausführen, etc.
```

### 3. Bei Secret-Änderungen

```bash
# Wenn Secrets im Vault geändert wurden:
pnpm pull-env  # Aktualisiert .env.local
```

---

## MCP-Konfiguration

Es gibt **zwei MCP-Server** konfiguriert:

```json
{
  "mcpServers": {
    "supabase_VAULT": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=zedhieyjlfhygsfxzbze"
    },
    "supabase_KESSEL": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=ufqlocxqizmiaozkashi"
    }
  }
}
```

**Verwendung:**

- **VAULT:** Secrets lesen/schreiben, Secret-Rotation
- **KESSEL:** App-Daten, Auth, Storage, tägliche Entwicklung

---

## 🔒 SERVICE_ROLE_KEY - Kritische Sicherheitsrichtlinien

Der `SERVICE_ROLE_KEY` ist **der mächtigste Schlüssel**. Er hat **vollständigen Zugriff** auf die Datenbank.

### ⚠️ NIEMALS:

1. Im Client-Code verwenden
2. In Git committen
3. Als `NEXT_PUBLIC_*` Variable definieren
4. In Logs ausgeben

### ✅ Nur verwenden in:

- `scripts/pull-env.mjs` (Vault-Zugriff)
- Server-Side API-Routes (wenn nötig)
- Production Environment Variables

---

## Sicherheits-Checkliste

- [ ] `.env` ist in `.gitignore`
- [ ] `.env.local` ist in `.gitignore`
- [ ] `SERVICE_ROLE_KEY` wird nur serverseitig verwendet
- [ ] MCP zeigt auf Daten-Projekt (nicht Vault!)
- [ ] Kein Client-Code importiert `SERVICE_ROLE_KEY`

---

## Verifikation

```bash
# Prüfe, ob .env in Git ist (sollte NICHT sein)
git ls-files | grep "\.env$"

# Prüfe .env (Vault-Projekt)
grep "supabase.co" .env
# Sollte: zedhieyjlfhygsfxzbze (Vault) zeigen

# Prüfe .env.local (KESSEL-Projekt)
grep "supabase.co" .env.local
# Sollte: ufqlocxqizmiaozkashi (KESSEL) zeigen

# Prüfe ob ANON_KEY auf richtiges Projekt zeigt
grep ANON_KEY .env.local | cut -d= -f2 | cut -d. -f2 | base64 -d | grep -o '"ref":"[^"]*"'
# Sollte: "ref":"ufqlocxqizmiaozkashi" zeigen
```

## Vault-Secrets korrigieren

Falls ein Secret im Vault falsch ist, kann es mit SQL korrigiert werden:

```sql
-- Secret im Vault aktualisieren
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'SECRET_NAME'),
  'NEUER_WERT',
  'SECRET_NAME'
);

-- Prüfen ob Update erfolgreich war
SELECT name, substring(decrypted_secret, 1, 50)
FROM vault.decrypted_secrets
WHERE name = 'SECRET_NAME';
```

---

## Weitere Informationen

- [Supabase Vault Documentation](https://supabase.com/docs/guides/platform/vault)
- [MCP Setup](./mcp-setup.md)
