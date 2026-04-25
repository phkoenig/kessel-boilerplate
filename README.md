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

| Kategorie      | Technologie                                         |
| -------------- | --------------------------------------------------- |
| **Framework**  | Next.js 16.0.7 (Turbopack, App Router)              |
| **UI**         | React 19, ShadCN UI, Radix UI Primitives            |
| **Styling**    | Tailwind CSS v4 (OKLCH-basiert), CSS-First Config   |
| **Identity**   | Clerk                                               |
| **Core**       | SpacetimeDB Core ueber `src/lib/core`               |
| **Storage**    | SpacetimeDB Blob-Storage (Themes, App-Icons)        |
| **App-DB**     | Supabase — **optional**, nur fuer Beispiel-Features |
| **AI**         | Vercel AI SDK, Gemini 2.5 Flash, assistant-ui       |
| **State**      | React Context, LocalStorage Persistence             |
| **Linting**    | ESLint 9 (Custom Rules), Prettier                   |
| **Testing**    | Vitest, Playwright                                  |
| **Secrets**    | 1Password CLI (`op`) + `pnpm pull-env`              |
| **Deployment** | Vercel-optimiert                                    |

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ (empfohlen: 20+)
- pnpm 8+
- 1Password CLI (`op`) mit Zugriff auf die Runtime-Secrets
- Clerk-Projekt (Pflicht, Identity)
- SpacetimeDB-Core (Pflicht, Themes/Icons/Nav/Profile)
- Supabase-Projekt **optional**, nur wenn die Beispiel-Features (Bug-Report, Feature-Wishlist, Datenquellen) aktiv sein sollen
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

**Alternative: Manuelles Setup (3-Schritt-Onboarding)**

```bash
# 1. Repository klonen und Dependencies installieren
git clone https://github.com/phkoenig/kessel-boilerplate.git
cd kessel-boilerplate
pnpm install

# 2. Bootstrap-.env anlegen (nur einmal pro Rechner)
cp .env.example .env
# Optional: OP_VAULT setzen, wenn dein 1Password-Vault nicht "VAULT" heisst.

# 3. Secrets aus 1Password ziehen (schreibt .env.local)
pnpm pull-env

# Danach: Dev-Server starten
pnpm dev
```

**Optional aber empfohlen — HTTPS-Dev-Subdomain (Clerk/OAuth/Webhooks-tauglich):**

```bash
# Einmalig pro Maschine
winget install --id Cloudflare.cloudflared
cloudflared tunnel login

# Einmalig pro Projekt
pnpm dev:setup-tunnel        # interaktiver Wizard
                              # legt Tunnel + DNS an, fuellt scripts/dev-public-origin.json,
                              # pinnt den Dev-Port

# Ab jetzt
pnpm dev:domain               # Next + Cloudflare Tunnel -> https://<projekt>-dev.megabrain.cloud
```

Warum: Clerk, OAuth, Webhooks und Embedded-Previews funktionieren auf `localhost`
unzuverlaessig. Master-Doku + Allokationsliste:
[`docs/02_architecture/dev-https-subdomain.md`](docs/02_architecture/dev-https-subdomain.md).

**Was `pnpm pull-env` macht:**

Boilerplate 3.0 speichert **alle** Runtime-Secrets in 1Password. `pnpm pull-env` liest das Manifest `scripts/pull-env.manifest.json`, ersetzt den Platzhalter `${OP_VAULT}` durch den konfigurierten Vault (default: `VAULT`) und loest jede Referenz per 1Password CLI auf. Ergebnis: eine vollstaendige, validierte `.env.local`.

**Default-Mappings:**

| Env-Variable                        | 1Password-Item           |
| ----------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL/...KEY`   | `App Runtime`            |
| `SUPABASE_SERVICE_ROLE_KEY`         | `App Runtime`            |
| `CLERK_SECRET_KEY/PUBLISHABLE_KEY`  | `KB - Auth Runtime`      |
| `NEXT_PUBLIC_SPACETIMEDB_*`         | `KB - Spacetime Runtime` |
| `OPENROUTER_API_KEY`, `FAL_API_KEY` | `KB - AI Runtime`        |

Die Dev-Supabase ist standardmaessig das MegaBrain-Projekt (`jpmhwyjiuodsvjowddsm.supabase.co`), weil Boilerplate 3.0 Supabase nur noch fuer App-DB und Storage nutzt (Core laeuft ueber SpacetimeDB).

**Troubleshooting:**

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

→ [kessel-cli Installation & Workflow](docs/04_knowledge/cli-workflow.md)

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

Supabase-Werte muessen nicht mehr per Hand gesetzt werden. `pnpm pull-env` zieht sie aus dem 1Password-Item `App Runtime`. Nur wenn du auf eine andere Supabase-Instanz umschalten willst, kannst du das Mapping in `scripts/pull-env.manifest.json` anpassen oder per `OP_REF_*` ueberschreiben (siehe `.env.example`).

Detaillierte Anleitung: [Secrets Management](docs/04_knowledge/secrets-management.md)

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

## 🧩 Boilerplate-Kern vs. Beispiel-Features

Der Kern dieser Boilerplate laeuft vollstaendig **ohne Supabase**. Supabase ist nur
fuer optionale Beispiel-Features vorgesehen. Entscheidung + Hintergrund:
[docs/12_plans/260419-boilerplate-db-agnostik.md](docs/12_plans/260419-boilerplate-db-agnostik.md).

| Bereich               | Kern (immer aktiv)                        | Beispiel-Feature (optional)                                                                    |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Identity              | Clerk                                     | —                                                                                              |
| Profile / Rollen      | SpacetimeDB-Core                          | —                                                                                              |
| Navigation / Branding | SpacetimeDB-Core                          | —                                                                                              |
| Themes (Metadaten)    | SpacetimeDB-Core `theme_registry`         | —                                                                                              |
| Theme-CSS / Icons     | SpacetimeDB-Core `blob_asset` + API-Proxy | —                                                                                              |
| App-Daten             | —                                         | Supabase (`feature_votes`, `bug_reports`, `ai_datasources`, ...)                               |
| Beispiel-UI-Routen    | —                                         | `/ueber-die-app/feature-wishlist`, `/ueber-die-app/bug-report`, `/app-verwaltung/datenquellen` |

Wenn `NEXT_PUBLIC_SUPABASE_URL` nicht gesetzt ist:

- die Nav blendet Beispiel-Routen aus (`SUPABASE_EXAMPLE_NAV_IDS` in `src/lib/config/features.ts`),
- betroffene API-Routen antworten mit 503 (`SUPABASE_NOT_CONFIGURED`),
- der Boot-Check (`src/lib/config/boot-check.ts`) protokolliert den Zustand beim Start.

Neue Kern-Features duerfen **keine** Supabase-Imports enthalten. Quellenhinweis:
Dateien mit Marker-Kommentar `// BOILERPLATE: example-feature (depends on Supabase)` sind
ausdruecklich vom Kern ausgenommen.

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
    ├── pull-env.mjs              # .env.local aus 1Password + Bootstrap
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

→ [Vollständige Dokumentation](docs/03_features/neues_app_shell_konzept.md)

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

→ [Design System Governance](docs/04_knowledge/design-system-governance.md)

### 🤖 AI Chat Assist Panel

KI-Assistent mit **multimodalem Kontext**:

- **Screenshot-Analyse**: Gemini 2.5 Flash sieht die aktuelle Ansicht
- **Wiki-Kontext**: App-Dokumentation automatisch geladen
- **User-Interaktionen**: Local-First Tracking der letzten Klicks
- **HTML-Dump**: Strukturelle Analyse der Seite

**Tech:** `assistant-ui`, `modern-screenshot`, Vercel AI SDK

→ [AI Chat Assist Dokumentation](docs/03_features/ai-chat-assist.md)

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

→ [AI-Interactable System Dokumentation](docs/03_features/ai-interactable-system.md)

### 🌈 Supabase Theme System

Dynamische Themes aus **Supabase Storage**:

- Themes in Storage Bucket `themes/` gespeichert
- Metadaten in `public.themes` Tabelle
- Import/Export via Theme Manager UI
- FOUC Prevention durch Server-Side CSS Injection
- Dynamisches Laden von Google Fonts

→ [Supabase Themes Setup](docs/04_knowledge/supabase-themes-setup.md)

### 📦 Duales Versioning-System

**App-Version** (SemVer) + **Boilerplate-Version**:

- App-Version aus Git-Tags (`vX.Y.Z`) oder `package.json`
- Boilerplate-Version aus `boilerplate.json`
- Automatische Generierung zur Build-Zeit
- Anzeige im Admin-Dashboard (`/app-verwaltung/app-dashboard`)

**Workflow:**

- App-Releases: Git-Tag setzen → Vercel deployt automatisch
- Boilerplate-Upgrades: `boilerplate.json` manuell aktualisieren

→ [App-Versionierung Dokumentation](docs/04_knowledge/app-versioning.md)

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

Runtime-Secrets kommen aus **1Password** (CLI `op`) und werden mit **`pnpm pull-env`** in `.env.local` geschrieben (Manifest: `scripts/pull-env.manifest.json`). Siehe [ADR-002](docs/02_architecture/ADR-002-boilerplate-3-0-system-boundaries.md).

```bash
pnpm pull-env
# → schreibt .env.local (Bootstrap-Variablen + 1Password-Felder)
```

**Architektur (3.0):**

- Bootstrap-Variablen (z. B. `NEXT_PUBLIC_SUPABASE_URL`) aus der Shell / CI
- Sensible Werte aus 1Password-Referenzen im Manifest
- Optional: app-spezifische Vault-/RPC-Pfade nur noch fuer Ableitungen, nicht Boilerplate-Standard

→ [Secrets Management Guide](docs/04_knowledge/secrets-management.md)

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
pnpm pull-env         # .env.local aus 1Password + Bootstrap
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

→ [Deployment Guide](docs/04_knowledge/deployment-guide.md)  
→ [Deployment Checklist](docs/04_knowledge/deployment-checklist.md)

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
