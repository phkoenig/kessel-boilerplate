# MCP Server Setup

Dieses Projekt verwendet **vier MCP-Server** für erweiterte KI-Funktionalität:

| MCP Server             | Zweck                               | Wann nutzen               |
| ---------------------- | ----------------------------------- | ------------------------- |
| **Context7**           | Library-Dokumentation abrufen       | Bei Fragen zu npm-Paketen |
| **Next.js DevTools**   | Fehler, Routen, Logs vom Dev-Server | Bei Next.js-Entwicklung   |
| **Cursor IDE Browser** | Browser-Automation, Screenshots     | UI-Testing, Debugging     |
| **Supabase**           | Datenbank-Operationen               | Bei DB-Änderungen         |

## 1. Context7 MCP Server

### Verwendung

Der Context7 MCP Server ermöglicht Zugriff auf aktuelle Library-Dokumentation:

```
# AI kann automatisch Docs abrufen:
"Wie funktioniert react-resizable-panels?"
→ Context7 holt aktuelle Dokumentation
```

### Tools

- `resolve-library-id` - Findet die richtige Library-ID
- `get-library-docs` - Holt aktuelle Dokumentation

## 2. Next.js DevTools MCP Server

### Verwendung

Der Next.js DevTools MCP Server kommuniziert direkt mit dem Next.js Dev-Server:

```
# AI kann Fehler und Routen abfragen:
"Was sind die aktuellen Fehler?"
→ nextjs_call(toolName: "get_errors")
```

### Tools

| Tool                   | Beschreibung                  |
| ---------------------- | ----------------------------- |
| `get_errors`           | Aktuelle Build/Runtime-Fehler |
| `get_routes`           | Alle App-Routen auflisten     |
| `get_project_metadata` | Projekt-Infos                 |
| `get_page_metadata`    | Aktive Seiten-Infos           |
| `get_logs`             | Dev-Server Logs               |

### Voraussetzungen

- Next.js 16+ (MCP ist built-in)
- Dev-Server muss laufen (`pnpm dev`)

## 3. Cursor IDE Browser MCP Server

### Verwendung

Browser-Automation für UI-Testing und visuelle Überprüfung:

```
# AI kann Browser steuern:
"Teste die Login-Seite"
→ browser_navigate, browser_snapshot, browser_click
```

### Tools

| Tool                       | Beschreibung                               |
| -------------------------- | ------------------------------------------ |
| `browser_navigate`         | URL öffnen                                 |
| `browser_snapshot`         | Accessibility-Baum (besser als Screenshot) |
| `browser_take_screenshot`  | Screenshot erstellen                       |
| `browser_click`            | Element klicken                            |
| `browser_type`             | Text eingeben                              |
| `browser_console_messages` | Konsolen-Ausgaben                          |

### Best Practices

1. **Snapshot vor Screenshot** - `browser_snapshot` ist schneller und aussagekräftiger
2. **Nach Änderungen testen** - Feature implementiert → Browser-Test
3. **Console prüfen** - Bei Fehlern `browser_console_messages` nutzen

## 4. Supabase MCP Server

### Verwendung

Direkte Datenbank-Interaktionen mit dem **Daten-Projekt**:

```
# AI kann DB-Operationen ausführen:
"Zeige alle Themes in der Datenbank"
→ Supabase MCP führt SQL aus
```

### Tools

- Datenbank-Schemas inspizieren
- SQL-Abfragen ausführen
- Tabellen verwalten
- Migrations erstellen

### Projekt-Referenz

**Daten-Projekt:** `jpmhwyjiuodsvjowddsm`

> ⚠️ **Wichtig:** Das MCP zeigt nur auf das Daten-Projekt, nicht auf das Vault-Projekt!
> Secrets werden via CLI (`pnpm pull-env`) aus dem separaten Vault-Projekt geholt.
> Siehe [Secrets Management](./secrets-management.md) für Details.

---

## Konfiguration

### Cursor-Einstellungen

Die MCP-Server werden in Cursor konfiguriert unter:

- **Settings** → **Features** → **MCP Servers**

Oder in der Datei `.cursor/mcp.json` (projekt-spezifisch).

### Beispiel-Konfiguration

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=jpmhwyjiuodsvjowddsm"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "chrome-devtools": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

> **Hinweis:** Es gibt nur EIN Supabase MCP (Daten-Projekt). Das Vault-Projekt wird via CLI angesprochen.

---

## Wann welchen MCP nutzen?

| Situation                        | MCP Server                 |
| -------------------------------- | -------------------------- |
| "Wie funktioniert Library X?"    | Context7                   |
| "Welche Fehler gibt es?"         | Next.js DevTools           |
| "Teste die Seite im Browser"     | Cursor IDE Browser         |
| "Zeige DB-Schema"                | Supabase                   |
| "Erstelle neue Tabelle"          | Supabase                   |
| "Warum rendert die Seite nicht?" | Next.js DevTools + Browser |

---

## Troubleshooting

### MCP-Server nicht verfügbar

1. Prüfe ob Dev-Server läuft (für Next.js DevTools)
2. Prüfe Cursor-Einstellungen
3. Starte Cursor neu

### Node-Version

Einige MCP-Server benötigen Node 22+:

```bash
node --version  # sollte v22+ sein
```
