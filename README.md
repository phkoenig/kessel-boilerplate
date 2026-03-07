# Kessel Boilerplate

> **Boilerplate 3.0** fuer moderne Next.js-Apps mit klaren Systemgrenzen: Clerk fuer Identity, SpacetimeDB als Boilerplate-Core, Supabase fuer App-DB und Storage sowie 1Password fuer Secrets.  
> Ziel ist eine robuste, agentenfreundliche Architektur fuer Ableitungen mit sauberem Multi-Tenant-Branding, Realtime-UI und AI-Assistenz.

---

## 🎯 Was ist das?

Ein **produktionsreifes Next.js 16 Template** mit:

- **B2B App Shell**: 4-Spalten-Layout (Navbar, Explorer, Main, Assist) mit `react-resizable-panels`
- **ShadCN UI**: Vollständig integrierte Komponenten-Bibliothek
- **Design System Governance**: Semantische Tokens mit ESLint-Enforcement
- **Clerk Identity**: Login, Sessions und Audience-Kontext über Clerk
- **Boilerplate Core**: zentrale Core-Abstraktion für Rollen, Navigation, Wiki, Theme-State und Chat-nahe Realtime-Flows
- **Supabase-Theme-System**: Dynamische Themes und Assets aus tenant-isoliertem Supabase Storage
- **AI Chat Assist**: Multimodaler KI-Assistent mit Screenshot-Analyse
- **RBAC-ready**: Role-Based Access Control mit `RoleGuard`
- **Developer Experience**: Cursor Rules, 1Password-`pull-env`, TypeScript Strict

---

## 🏗️ Tech Stack

| Kategorie      | Technologie                                       |
| -------------- | ------------------------------------------------- |
| **Framework**  | Next.js 16.0.7 (Turbopack, App Router)            |
| **UI**         | React 19, ShadCN UI, Radix UI Primitives          |
| **Styling**    | Tailwind CSS v4 (OKLCH-basiert), CSS-First Config |
| **Identity**   | Clerk                                             |
| **Core**       | SpacetimeDB Core ueber `src/lib/core`             |
| **Backend**    | Supabase (App-DB, Storage)                        |
| **AI**         | Vercel AI SDK, Gemini 2.5 Flash, assistant-ui     |
| **State**      | React Context, LocalStorage Persistence           |
| **Linting**    | ESLint 9 (Custom Rules), Prettier                 |
| **Testing**    | Vitest, Playwright                                |
| **Secrets**    | 1Password CLI (`op`) + `pnpm pull-env`            |
| **Deployment** | Vercel-optimiert                                  |

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ (empfohlen: 20+)
- pnpm 8+
- 1Password CLI (`op`) mit Zugriff auf die Runtime-Secrets
- Supabase-Projekt für App-DB + Storage
- API-Keys: Google Gemini, OpenAI (optional)

### 2. Installation mit kessel-cli (empfohlen)

```bash
# Mit kessel-cli (automatisches Setup)
kessel mein-projekt

# Das Tool führt automatisch durch:
# - GitHub Repository erstellen
# - Clerk, Spacetime-Core und App-Supabase vorbereiten
# - Secrets aus 1Password laden
# - Dependencies installieren
```

**Alternative: Manuelles Setup**

```bash
# Repository klonen
git clone https://github.com/phkoenig/kessel-boilerplate.git
cd kessel-boilerplate

# Dependencies installieren
pnpm install

# Environment-Variablen einrichten
# 1. Bootstrap-Werte setzen (.env oder Shell-Env)
# 2. pnpm pull-env ausführen (lädt Secrets aus 1Password → .env.local)
pnpm pull-env

# Dev-Server starten
pnpm dev
```

**Wichtig - Secrets:**

> ⚠️ Nach `pnpm install` werden automatisch die Secrets aus 1Password geladen.
> Falls dies fehlschlägt, führe **manuell `pnpm pull-env`** aus!
>
> Ohne diesen Schritt fehlen API-Keys wie `OPENROUTER_API_KEY` und `FAL_KEY`.
>
> Auf **jedem neuen Rechner** muss der 1Password-CLI-Flow einmal sauber eingerichtet werden. Der stabile Weg ist der manuelle CLI-Login mit `op account add` und `op signin --raw`, nicht eine endlose Desktop-Popup-Schleife.

Kurzform fuer neue Rechner:

```bash
export PATH="$PATH:/c/Users/<user>/AppData/Local/Microsoft/WinGet/Links"
export OP_BIOMETRIC_UNLOCK_ENABLED=false
op account add --address my.1password.eu --email <deine-mail> --shorthand kessel
export OP_ACCOUNT=kessel
export OP_SESSION_kessel="$(op signin --account kessel --raw)"
op vault list
pnpm pull-env
```

- **Local Dev Bypass** ist standardmäßig aktiviert - ohne eingeloggten User erfolgt ein Redirect zu `/login`, wo ein User-Selector statt der normalen Auth-Form angezeigt wird

→ [kessel-cli Installation & Workflow](docs/guides/cli-workflow.md)

### 3. Architektur-Setup

Boilerplate 3.0 trennt die Verantwortlichkeiten bewusst:

- `Clerk`: Identity und Sessions
- `src/lib/core`: Boilerplate-Core-Vertrag fuer Rollen, Settings, Wiki, Theme-State und Realtime-nahe Pfade
- `Supabase`: App-Daten und Storage
- `1Password`: Secrets fuer `pnpm pull-env`

Die verbindliche Architekturentscheidung steht in `docs/02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md`.

### 4. Supabase Setup (nur App-DB + Storage)

Supabase ist in Boilerplate 3.0 **nicht** mehr der Ort fuer Boilerplate-Core-Daten. Supabase bleibt zustaendig fuer:

- app-spezifische Fachdaten
- Buckets und Assets
- Uploads, Signed URLs, Previews und Thumbnails

**Manuelles Setup** (falls CLI nicht verwendet):

```bash
# Bootstrap-Werte fuer die App-Supabase setzen
NEXT_PUBLIC_SUPABASE_URL=https://<app-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_TENANT_SLUG=dein-projekt

# Danach Secrets aus 1Password ziehen
pnpm pull-env
```

Detaillierte Anleitung: [Secrets Management](docs/guides/secrets-management.md)

### 5. Standard-User (nur Entwicklung)

Bei der Einrichtung mit `kessel-cli` werden automatisch zwei Standard-User angelegt:

| Rolle     | E-Mail-Adresse | Passwort   | Beschreibung                              |
| --------- | -------------- | ---------- | ----------------------------------------- |
| **Admin** | `admin@local`  | `admin123` | Vollzugriff auf alle Bereiche             |
| **User**  | `user@local`   | `user123`  | Standard-User mit eingeschränkten Rechten |

**⚠️ SICHERHEITSHINWEIS:**  
Diese Credentials sind nur für die **Entwicklung** gedacht!  
**In Production müssen diese User gelöscht oder die Passwörter geändert werden!**

Siehe auch: [App Wiki - Authentifizierung](src/content/wiki.md#kapitel-7-authentifizierung-und-test-user)

### 6. Cursor MCP Setup

Dieses Projekt nutzt **genau einen Supabase-MCP** in Cursor:

```json
{
  "mcpServers": {
    "app_supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=ufqlocxqizmiaozkashi"
    }
  }
}
```

**Wichtig:**

- Der MCP zeigt immer auf die App-Supabase der aktuellen Ableitung
- **Keine weiteren Supabase-MCPs hinzufügen** (Cursor-Bug bei Multi-MCP-Routing)
- SpacetimeDB und andere Systeme werden nicht ueber zusaetzliche Supabase-MCPs angesprochen

→ [MCP Governance Rules](.cursor/rules/mcp-governance.mdc)

---

## 📁 Projektstruktur

```
next-supabase-shadcn-template/
├── src/
│   ├── app/
│   │   ├── (shell)/              # App Shell Route Group
│   │   │   ├── about/            # Wiki, Features, Bug-Report
│   │   │   └── account/          # Theme, Profil, Security
│   │   ├── api/
│   │   │   ├── chat/             # AI Chat API
│   │   │   ├── themes/           # Theme-Management API
│   │   │   └── content/          # Wiki-Content API
│   │   └── globals.css           # Tailwind v4 @theme Konfiguration
│   ├── components/
│   │   ├── shell/                # 🎯 App Shell Komponenten
│   │   │   ├── AppShell.tsx      # 4-Spalten-Layout
│   │   │   ├── Navbar.tsx        # Primäre Navigation
│   │   │   ├── ExplorerPanel.tsx # Kontext-Browser
│   │   │   ├── AssistPanel.tsx   # Hilfe/Chat/Warenkorb
│   │   │   ├── AIChatPanel.tsx   # AI Chat mit Screenshot
│   │   │   └── PageContent.tsx   # Standard-Wrapper für Seiten
│   │   ├── ui/                   # ShadCN UI Komponenten
│   │   ├── auth/                 # Auth & RBAC
│   │   └── content/              # MarkdownViewer, etc.
│   ├── lib/
│   │   ├── ai-chat/              # Chat-Logik, Screenshot-Capture
│   │   ├── fonts/                # Dynamic Font Loader
│   │   └── themes/               # Theme Provider
│   ├── config/
│   │   └── navigation.ts         # 🎯 Zentrale Navigation
│   ├── content/
│   │   └── wiki.md               # Wiki Single Source of Truth
│   └── hooks/
│       └── use-interaction-log.ts # Local-First Interaction-Tracking
├── docs/                         # 📚 Umfangreiche Dokumentation
│   ├── 01_governance/            # 🧠 Regeln & Standards
│   ├── 02_architecture/          # 🧠 Systemaufbau
│   ├── 03_features/              # 🧠 Feature-Konzepte
│   └── 04_knowledge/             # 🪶 Learnings & How-Tos
├── eslint/
│   └── rules/                    # 🎯 Custom ESLint Rules
│       ├── no-hardcoded-tailwind.js
│       └── use-design-system-components.js
├── .cursor/
│   └── rules/                    # 🎯 AI-Coding-Guidelines
├── supabase/
│   └── migrations/               # Datenbank-Migrationen
└── scripts/
    ├── pull-env.mjs              # Secrets aus Vault abrufen
    ├── validate-docs-structure.mjs
    └── validate-layout-consistency.mjs
```

---

## ✨ Key Features

### 🖼️ B2B App Shell

Das Herzstück: Ein **4-Spalten-Layout** mit flexiblen, resizable Panels:

| Spalte      | Funktion                               | Breite | Kollabierbar |
| ----------- | -------------------------------------- | ------ | ------------ |
| 1. Navbar   | Primäre Navigation                     | 15-25% | ✅ (Cmd+B)   |
| 2. Explorer | Kontext-Browser, Datei-Baum            | 15-30% | ✅ (Cmd+E)   |
| 3. Main     | Hauptinhalt mit Floating Header/Footer | 30%+   | ❌           |
| 4. Assist   | Hilfe, Chat, Warenkorb                 | 20-35% | ✅ (Cmd+J)   |

**Panel-States werden in LocalStorage persistiert.**

→ [Vollständige Dokumentation](docs/specifications/neues_app_shell_konzept.md)

### 🎨 Design System Governance

Strikte Durchsetzung von **semantischen Design-Tokens** via ESLint:

```tsx
// ❌ VERBOTEN
;<div className="rounded-[8px] bg-blue-500 p-[17px]">
  <button onClick={handleClick}>Speichern</button>
</div>

// ✅ RICHTIG
import { Button } from "@/components/ui/button"
;<div className="bg-primary rounded-md p-4">
  <Button onClick={handleClick}>Speichern</Button>
</div>
```

**ESLint-Regeln erzwingen:**

- Keine Hardcoded-Werte (`bg-blue-500`, `p-[17px]`)
- Keine nativen HTML-Elemente (`<button>`, `<input>`)
- Nur semantische Tokens (`bg-primary`, `p-4`, `rounded-md`)

→ [Design System Governance](docs/guides/design-system-governance.md)

### 🤖 AI Chat Assist Panel

KI-Assistent mit **multimodalem Kontext**:

- **Screenshot-Analyse**: Gemini 2.5 Flash sieht die aktuelle Ansicht
- **Wiki-Kontext**: App-Dokumentation automatisch geladen
- **User-Interaktionen**: Local-First Tracking der letzten Klicks
- **HTML-Dump**: Strukturelle Analyse der Seite

**Tech:** `assistant-ui`, `modern-screenshot`, Vercel AI SDK

→ [AI Chat Assist Dokumentation](docs/specifications/ai-chat-assist.md)

### 🎯 AI-Interactable Component System

**NEU:** Deklarative KI-Steuerung von UI-Komponenten:

```tsx
// Jede interaktive Komponente wird für die KI "sichtbar"
<AIInteractable
  id="theme-dark-mode-toggle"
  action="toggle"
  target="color-mode"
  description="Schaltet zwischen Dark Mode und Light Mode um"
  keywords={["dark mode", "light mode", "dunkel", "hell"]}
  category="settings"
>
  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
</AIInteractable>
```

**Features:**

- **Deklarativ**: Komponenten beschreiben ihre KI-Capabilities
- **Build-Zeit Validierung**: ESLint-Regeln erzwingen Compliance
- **Dynamische Tools**: Runtime-Generierung von KI-Tools aus Registry
- **Keyword-Suche**: KI findet Komponenten über natürliche Sprache

**ESLint Governance:**

| Regel                     | Funktion                                   |
| ------------------------- | ------------------------------------------ |
| `ai-component-compliance` | Prüft Manifest-Registrierung               |
| `require-ai-wrapper`      | Erzwingt AIInteractable für UI-Komponenten |

→ [AI-Interactable System Dokumentation](docs/ai-interactable-system.md)

### 🌈 Supabase Theme System

Dynamische Themes aus **Supabase Storage**:

- Themes in Storage Bucket `themes/` gespeichert
- Metadaten in `public.themes` Tabelle
- Import/Export via Theme Manager UI
- FOUC Prevention durch Server-Side CSS Injection
- Dynamisches Laden von Google Fonts

→ [Supabase Themes Setup](docs/guides/supabase-themes-setup.md)

### 📦 Duales Versioning-System

**App-Version** (SemVer) + **Boilerplate-Version**:

- App-Version aus Git-Tags (`vX.Y.Z`) oder `package.json`
- Boilerplate-Version aus `boilerplate.json`
- Automatische Generierung zur Build-Zeit
- Anzeige im Admin-Dashboard (`/app-verwaltung/app-dashboard`)

**Workflow:**

- App-Releases: Git-Tag setzen → Vercel deployt automatisch
- Boilerplate-Upgrades: `boilerplate.json` manuell aktualisieren

→ [App-Versionierung Dokumentation](docs/guides/app-versioning.md)

---

## 🧪 Testing

```bash
# Unit Tests
pnpm test              # Watch-Mode
pnpm test:run          # Single Run
pnpm test:coverage     # Coverage Report

# E2E Tests
pnpm test:e2e          # Headless
pnpm test:e2e:ui       # UI-Mode

# Validierung
pnpm validate-docs     # Dokumentationsstruktur
pnpm validate-layout   # Layout-Konsistenz
pnpm lint              # ESLint
```

---

## 🔐 Secrets Management

Das Projekt verwendet **Supabase Vault** als zentralen Secrets-Store:

```bash
# Secrets aus Vault abrufen
pnpm pull-env

# → Schreibt .env.local mit allen Secrets
```

**Architektur:**

- `.env`: Bootstrap (Vault-Credentials, manuell)
- `.env.local`: App-Secrets (automatisch via `pnpm pull-env`)
- Vercel: Environment Variables aus Vault exportieren

→ [Secrets Management Guide](docs/guides/secrets-management.md)

---

## 📚 Dokumentation

Die vollständige Dokumentation ist in **7 Ebenen** strukturiert:

| Ebene                 | Typ           | Beschreibung                       |
| --------------------- | ------------- | ---------------------------------- |
| **01_governance/**    | 🧠 Core       | Regeln, Standards, Verbote         |
| **02_architecture/**  | 🧠 Core       | Systemaufbau, Layer, Deployment    |
| **03_features/**      | 🧠 Core       | App Shell, AI Chat, Komponenten    |
| **04_knowledge/**     | 🪶 Playground | Learnings, How-Tos, Best Practices |
| **05_communication/** | 🪶 Playground | README, Contributing, License      |
| **06_history/**       | 🧠 Core       | Changelog, Release Notes           |
| **07_automation/**    | 🧠 Core       | Skripte, CI/CD                     |

**🧠 Core**: Machine-readable, automatisch von KI-Tools geladen  
**🪶 Playground**: Human-readable, manuell konsultiert

→ [Dokumentations-Index](docs/README.md)

---

---

## 🛠️ Development

### NPM Scripts

```bash
pnpm dev              # Dev-Server (Port 3000)
pnpm build            # Production Build
pnpm start            # Production Server
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + Auto-Fix
pnpm format           # Prettier
pnpm pull-env         # Secrets aus Vault
```

### Git Workflow

**Pre-Commit Hooks (Husky + lint-staged):**

- ESLint für `.ts`, `.tsx`, `.js`, `.jsx`
- Prettier für alle Dateien
- Dokumentations-Validierung
- Layout-Konsistenz-Prüfung

```bash
# Commit auslösen
git commit -m "feat: Neue Funktion"

# → Automatisch: ESLint, Prettier, Validierung
```

---

## 🚢 Deployment

### Vercel (empfohlen)

> ⚠️ **WICHTIG:** Die Region ist auf `fra1` (Frankfurt/EU) vorkonfiguriert in `vercel.json`.
> Niemals ändern! US-Region führt zu Problemen mit Exchange-APIs (KuCoin, Binance blockieren US-IPs).

1. **Environment Variables setzen:**
   - `NEXT_PUBLIC_SUPABASE_URL` (Daten-Projekt)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SERVICE_ROLE_KEY` (Private!)
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `OPENAI_API_KEY` (optional)

2. **Build Settings:**
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Supabase Storage CORS:**
   ```sql
   -- In Supabase Dashboard: Storage → Settings → CORS
   -- Vercel-Domain hinzufügen
   ```

→ [Deployment Guide](docs/guides/deployment-guide.md)  
→ [Deployment Checklist](docs/guides/deployment-checklist.md)

---

## 🤝 Contributing

Dieses Projekt folgt strikten **Governance-Regeln**:

- **Keine `any` Types**: Immer explizite Types
- **Keine Hardcoded Values**: Nur semantische Tokens
- **Keine nativen HTML-Elemente**: Nur ShadCN-Komponenten
- **TSDoc für alle Exports**: Vollständige Dokumentation
- **Tests für neue Features**: Unit + E2E

→ [Governance-Regeln](.cursor/rules/)

---

## 📝 License

Private/Proprietary - Dieses Repository ist Teil der Kessel Boilerplate.

---

## 🙏 Credits

**Gebaut mit:**

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [ShadCN UI](https://ui.shadcn.com/) - Komponenten-Bibliothek
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI Integration
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [assistant-ui](https://assistant-ui.com/) - Chat-UI

---

## 📞 Support & Contact

Für Fragen oder Support:

- **Dokumentation**: [docs/README.md](docs/README.md)
- **GitHub Issues**: [github.com/phkoenig/kessel-boilerplate/issues](https://github.com/phkoenig/kessel-boilerplate/issues)
- **CLI Tool**: [kessel-cli](https://github.com/phkoenig/kessel-cli)

---

**🚀 Powered by Philip König, Berlin**  
_Die vollständige Boilerplate für moderne B2B-Anwendungen._
