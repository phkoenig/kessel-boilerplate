# Kessel Integration Roadmap

> **Status:** 🔄 In Arbeit  
> **Erstellt:** 2025-12-06  
> **Letzte Aktualisierung:** 2025-12-06  
> **Ziel:** Full-Stack B2B Boilerplate mit integriertem UI-System

## Vision

Dieses UI-Template (ShadCN-Test-01) soll in die **Kessel Boilerplate** gemerged werden, um eine vollständige Full-Stack-Boilerplate mit professionellem UI-System zu schaffen.

```
kessel mein-projekt
    │
    ├─→ Next.js 16 + React 19
    ├─→ Supabase (Auth, DB, Storage, Vault)
    ├─→ ShadCN UI Komponenten
    │
    └─→ NEU: B2B App Shell aus diesem Projekt
        ├─→ 4-Spalten-Layout (Navbar, Explorer, Main, Assist)
        ├─→ react-resizable-panels für flexible Layouts
        ├─→ Theme-System mit Supabase Storage
        ├─→ Semantische Design Tokens (OKLCH)
        ├─→ Design System Governance (ESLint-Regeln)
        ├─→ Custom Scrollbars (zentral definiert)
        └─→ RBAC mit RoleGuard-Komponente
```

---

## 📋 Master-Checkliste für den Merge

Diese Checkliste definiert **alle Punkte**, die vor dem Merge abgeschlossen sein müssen.

### 1. App Shell & Layout

| Status | Komponente              | Beschreibung                      | Datei/Ordner                             |
| ------ | ----------------------- | --------------------------------- | ---------------------------------------- |
| ✅     | 4-Spalten-Layout        | Navbar, Explorer, Main, Assist    | `src/components/shell/AppShell.tsx`      |
| ✅     | Resizable Panels        | react-resizable-panels integriert | `src/components/ui/resizable.tsx`        |
| ✅     | LocalStorage Persistenz | Panel-Größen und States speichern | `src/components/shell/shell-context.tsx` |
| ✅     | Floating Header/Footer  | In Main Area                      | `MainHeader.tsx`, `MainFooter.tsx`       |
| ✅     | Breadcrumbs             | Automatisch aus Route             | `Breadcrumbs.tsx`                        |
| ✅     | Keyboard Shortcuts      | Cmd+B/E/J für Panel-Toggle        | `KeyboardShortcuts.tsx`                  |
| ⬜     | Mobile Responsiveness   | Collapsed Navbar auf Mobile       | TODO                                     |
| ⬜     | Touch-Gesten            | Swipe für Panel-Toggle            | Optional                                 |

### 2. Navigation & Routing

| Status | Komponente          | Beschreibung                     | Datei/Ordner               |
| ------ | ------------------- | -------------------------------- | -------------------------- |
| ✅     | Navbar              | Primäre Navigation mit Accordion | `Navbar.tsx`               |
| ✅     | Navigation Config   | Zentrale Nav-Definition          | `src/config/navigation.ts` |
| ✅     | Route Groups        | (shell)/ Route-Group             | `src/app/(shell)/`         |
| ✅     | PageContent Wrapper | Standard-Layout für Seiten       | `PageContent.tsx`          |
| ⬜     | Deep Linking        | URL-Sync für Panel-States        | Optional                   |

### 3. Theme-System

| Status | Komponente       | Beschreibung              | Datei/Ordner         |
| ------ | ---------------- | ------------------------- | -------------------- |
| ✅     | CSS-First Config | Tailwind v4 @theme inline | `globals.css`        |
| ✅     | Supabase Storage | Themes in Storage Bucket  | `/api/themes/`       |
| ✅     | FOUC Prevention  | Server-side CSS Injection | `layout.tsx`         |
| ✅     | Dynamic Fonts    | Google Fonts on-demand    | `src/lib/fonts/`     |
| ✅     | Dark Mode        | next-themes Integration   | `theme-provider.tsx` |
| ⬜     | Theme Manager UI | Import/Export Interface   | `/account/theme/`    |

### 4. Design System Governance

| Status | Komponente                           | Beschreibung                 | Datei/Ordner         |
| ------ | ------------------------------------ | ---------------------------- | -------------------- |
| ✅     | Semantische Tokens                   | OKLCH Farben, Spacing, Radii | `globals.css`        |
| ✅     | Status-Farben                        | success, warning, info       | `globals.css`        |
| ✅     | ESLint: no-hardcoded-tailwind        | Verbietet bg-blue-500, etc.  | `eslint/rules/`      |
| ✅     | ESLint: use-design-system-components | Erzwingt ShadCN-Komponenten  | `eslint/rules/`      |
| ✅     | Pre-Commit Hooks                     | Automatische Prüfung         | `.husky/pre-commit`  |
| ✅     | Cursor Rules                         | AI-Anleitung                 | `.cursor/rules/`     |
| ⬜     | GitHub Actions                       | CI/CD Integration            | `.github/workflows/` |

### 5. Scrollbar & UI Polish

| Status | Komponente          | Beschreibung                    | Datei/Ordner      |
| ------ | ------------------- | ------------------------------- | ----------------- |
| ✅     | ScrollArea          | Standard (sichtbar)             | `scroll-area.tsx` |
| ✅     | MainScrollArea      | Hover-only Scrollbar            | `scroll-area.tsx` |
| ✅     | Zentrale Definition | Eine Stelle für alle Scrollbars | `scroll-area.tsx` |
| ⬜     | Loading States      | Skeleton-Loader für Panels      | TODO              |
| ⬜     | Error Boundaries    | Graceful Error Handling         | TODO              |

### 6. Auth & RBAC

| Status | Komponente       | Beschreibung             | Datei/Ordner           |
| ------ | ---------------- | ------------------------ | ---------------------- |
| ✅     | AuthProvider     | Demo-Implementation      | `src/components/auth/` |
| ✅     | RoleGuard        | Client-side Visibility   | `RoleGuard.tsx`        |
| ✅     | Nav Role-Filter  | Items nach Rolle filtern | `navigation.ts`        |
| ⬜     | Supabase Auth    | Echte Auth-Integration   | TODO                   |
| ⬜     | Server-side RBAC | Middleware Protection    | TODO                   |

### 7. Dokumentation

| Status | Komponente               | Beschreibung          | Datei/Ordner                  |
| ------ | ------------------------ | --------------------- | ----------------------------- |
| ✅     | App Shell Konzept        | Architektur-Doku      | `neues_app_shell_konzept.md`  |
| ✅     | Design System Governance | Token-Regeln          | `design-system-governance.md` |
| ✅     | Cursor Rules             | AI-Anleitung komplett | `.cursor/rules/`              |
| ⬜     | README für Boilerplate   | Nutzer-Dokumentation  | `README.md`                   |
| ⬜     | Beispiel-App             | Demo-Seiten komplett  | `/app/(shell)/`               |

### 8. Code-Qualität

| Status | Komponente             | Beschreibung      | Datei/Ordner  |
| ------ | ---------------------- | ----------------- | ------------- |
| ✅     | Keine Hardcoded Values | ESLint erzwingt   | ESLint        |
| ✅     | Keine Native Elements  | ShadCN-Only       | ESLint        |
| ✅     | TypeScript Strict      | Keine `any`       | tsconfig.json |
| ⬜     | Unit Tests             | Shell-Komponenten | `__tests__/`  |
| ⬜     | E2E Tests              | Kritische Flows   | `e2e/`        |
| ⬜     | Performance Audit      | Lighthouse Score  | TODO          |

---

## 📊 Fortschritts-Tracker

### Aktueller Stand

```
Kategorie                  Erledigt    Offen    Gesamt
─────────────────────────────────────────────────────
1. App Shell & Layout      6           2        8
2. Navigation & Routing    4           1        5
3. Theme-System            5           1        6
4. Design System Gov.      6           1        7
5. Scrollbar & UI Polish   3           2        5
6. Auth & RBAC             3           2        5
7. Dokumentation           3           2        5
8. Code-Qualität           3           3        6
─────────────────────────────────────────────────────
GESAMT                     33          14       47
Fortschritt                70%
```

### Prioritäten für den nächsten Sprint

1. **🔴 Kritisch:** Mobile Responsiveness
2. **🟠 Hoch:** Supabase Auth Integration
3. **🟡 Mittel:** Unit Tests für Shell-Komponenten
4. **🟢 Niedrig:** Theme Manager UI

---

## 🔄 Aktualisierungs-Workflow

### Bei jeder Änderung am UI-System

1. Prüfe, ob ein Punkt in dieser Liste betroffen ist
2. Aktualisiere den Status (⬜ → ✅)
3. Aktualisiere den Fortschritts-Tracker
4. Committe die Änderungen mit `docs: Roadmap aktualisiert`

### Vor dem Merge

1. **Alle ✅** in der Checkliste?
2. **Keine ⬜** in "Kritisch"-Kategorien?
3. **README** für Boilerplate geschrieben?
4. **Final Review** mit Kessel-Repository durchgeführt?

---

## 📂 Repository-Struktur nach Merge

```
next-supabase-shadcn-template/
├── src/
│   ├── app/
│   │   └── (shell)/           # NEU: App Shell Route Group
│   ├── components/
│   │   ├── shell/             # NEU: Shell-Komponenten
│   │   └── ui/                # ShadCN UI (erweitert)
│   ├── config/
│   │   └── navigation.ts      # NEU: Navigation Config
│   └── lib/
│       ├── fonts/             # NEU: Dynamic Font Loader
│       └── themes/            # NEU: Theme Provider
├── eslint/
│   └── rules/                 # NEU: Custom ESLint Rules
├── .cursor/
│   └── rules/                 # NEU: Cursor Rules
└── docs/                      # NEU: Dokumentation
```

---

## 🚀 Langfristige Vision

Diese Boilerplate dient auch als Basis für:

1. **Kessel CLI** - Schneller Projekt-Start
2. **"Flatter, smaller, faster"** - Enterprise-Lösung für On-Demand Software
3. **Eigene Projekte** - Konsistentes UI für alle B2B-Apps

---

_Letzte Aktualisierung: 2025-12-06_
_Nächste Review: Bei Erreichen von 80% Fortschritt_
