# Next.js + Supabase + ShadCN UI Template

> **⚠️ Status: UI-Komponente einer größeren Boilerplate**  
> Dieses Repository enthält das **UI-System und Frontend-Architektur** für eine Full-Stack B2B-Boilerplate.  
> Der Merge mit dem Backend und der vollständigen Kessel-Infrastruktur ist in Planung (siehe [Kessel Integration Roadmap](docs/04_knowledge/kessel-integration-roadmap.md)).

---

## 🎯 Was ist das?

Ein **produktionsreifes Next.js 16 Template** mit:

- **B2B App Shell**: 4-Spalten-Layout (Navbar, Explorer, Main, Assist) mit `react-resizable-panels`
- **ShadCN UI**: Vollständig integrierte Komponenten-Bibliothek
- **Design System Governance**: Semantische Tokens mit ESLint-Enforcement
- **Supabase-Theme-System**: Dynamische Themes aus Supabase Storage
- **AI Chat Assist**: Multimodaler KI-Assistent mit Screenshot-Analyse
- **RBAC-ready**: Role-Based Access Control mit `RoleGuard`
- **Developer Experience**: Cursor Rules, Pre-Commit Hooks, TypeScript Strict

---

## 🏗️ Tech Stack

| Kategorie      | Technologie                                       |
| -------------- | ------------------------------------------------- |
| **Framework**  | Next.js 16.0.7 (Turbopack, App Router)            |
| **UI**         | React 19, ShadCN UI, Radix UI Primitives          |
| **Styling**    | Tailwind CSS v4 (OKLCH-basiert), CSS-First Config |
| **Backend**    | Supabase (Auth, Database, Storage, Vault)         |
| **AI**         | Vercel AI SDK, Gemini 2.5 Flash, assistant-ui     |
| **State**      | React Context, LocalStorage Persistence           |
| **Linting**    | ESLint 9 (Custom Rules), Prettier                 |
| **Testing**    | Vitest, Playwright                                |
| **Deployment** | Vercel-optimiert                                  |

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ (empfohlen: 20+)
- pnpm 8+
- Supabase-Projekt (2x: Vault + Daten)
- API-Keys: Google Gemini, OpenAI (optional)

### 2. Installation

```bash
# Repository klonen
git clone https://github.com/phkoenig/shadcn-test-01.git
cd shadcn-test-01

# Dependencies installieren
pnpm install

# Environment-Variablen einrichten
# 1. .env erstellen (Vault-Credentials)
# 2. pnpm pull-env ausführen (lädt Secrets aus Supabase Vault → .env.local)
pnpm pull-env

# Dev-Server starten
pnpm dev
```

**Wichtig:** Vor jedem `pnpm dev` sollte `pnpm pull-env` ausgeführt werden, um aktuelle Secrets zu laden.

### 3. Supabase Setup

```bash
# Migrationen ausführen
npx supabase db push

# Themes Storage Bucket erstellen (siehe docs/04_knowledge/supabase-themes-setup.md)

# Test-User anlegen und Auth konfigurieren
pnpm setup
```

Detaillierte Anleitung: [Supabase Themes Setup](docs/04_knowledge/supabase-themes-setup.md)

### 4. Standard Test-User

Bei der Einrichtung werden automatisch drei Test-User angelegt:

| Rolle     | E-Mail-Adresse       | Passwort    | Beschreibung                              |
| --------- | -------------------- | ----------- | ----------------------------------------- |
| **Admin** | `admin@kessel.local` | `Admin123!` | Vollzugriff auf alle Bereiche             |
| **User**  | `user@kessel.local`  | `User123!`  | Standard-User mit eingeschränkten Rechten |
| **Test**  | `test@kessel.local`  | `Test123!`  | Zusätzlicher Test-Account                 |

**⚠️ WICHTIG:** Diese Test-User sind nur für die Entwicklung gedacht und müssen in Production geändert oder gelöscht werden!

Siehe auch: [App Wiki - Authentifizierung](src/content/wiki.md#kapitel-7-authentifizierung-und-test-user)

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

### 🌈 Supabase Theme System

Dynamische Themes aus **Supabase Storage**:

- Themes in Storage Bucket `themes/` gespeichert
- Metadaten in `public.themes` Tabelle
- Import/Export via Theme Manager UI
- FOUC Prevention durch Server-Side CSS Injection
- Dynamisches Laden von Google Fonts

→ [Supabase Themes Setup](docs/04_knowledge/supabase-themes-setup.md)

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

## 🔗 Kessel Integration Status

**⚠️ Dieses Repository ist Teil einer größeren Vision:**

Entweder wird:

- A) Der **Rest der Kessel Boilerplate** hier integriert (Backend, Auth, API), **oder**
- B) Dieses **UI-System in die Kessel Boilerplate** gemerged

**Aktueller Fortschritt:** 70% (33/47 Tasks)

Kritische offene Punkte:

- Mobile Responsiveness
- Supabase Auth Integration
- Unit Tests für Shell-Komponenten
- Theme Manager UI (vollständig)

→ [Kessel Integration Roadmap](docs/04_knowledge/kessel-integration-roadmap.md)

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

Für Fragen zur Kessel-Integration oder diesem Template:

- **Dokumentation**: [docs/README.md](docs/README.md)
- **GitHub Issues**: [github.com/phkoenig/shadcn-test-01/issues](https://github.com/phkoenig/shadcn-test-01/issues)
- **Roadmap**: [Kessel Integration](docs/04_knowledge/kessel-integration-roadmap.md)

---

**🚀 Powered by Philip König, Berlin**  
_Ein UI-System für moderne B2B-Anwendungen._
