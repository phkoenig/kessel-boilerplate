# Projekt-Spezifikation: B2B App Shell (Next.js 16)

## 1. Projekt-Kontext & Ziel

Entwicklung einer **B2B App-Shell / UI-Boilerplate** als wiederverwendbares Template für skalierbare Business-Anwendungen.
Das Template wird später in die **Kessel CLI** integriert.

### Ziel

Ein konsistentes, hoch-performantes UI-Gerüst mit:

- Strikter Trennung von Layout und Inhalt
- Integriertem Theme-System (TweakCN Import)
- 4-Spalten-Layout mit `react-resizable-panels`

### Tech Stack (Strikt)

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4 (CSS-First), ShadCN UI, Radix Primitives
- **Icons:** Lucide React
- **Backend/Auth:** Supabase (Auth, Storage für Themes)
- **Design Tokens:** OKLCH Farben, strikte Radius/Spacing-Skala (in `globals.css`)
- **Panels:** `react-resizable-panels`

---

## 2. Layout-Architektur: Das "4-Spalten-Prinzip"

Das Layout unterteilt den Viewport in vier vertikale Bereiche.

```
┌─────────┬──────────────┬─────────────────────────────┬─────────────┐
│ Spalte 1│   Spalte 2   │         Spalte 3            │  Spalte 4   │
│ Navbar  │   Explorer   │        Main Area            │   Assist    │
│         │  (optional)  │                             │  (optional) │
│         │              │  ┌─────────────────────┐    │             │
│ [====]  │  Titel =     │  │ floating Header     │    │  AI-Chat    │
│ [====]  │  aktiver     │  │ (Breadcrumbs)       │    │  Wiki       │
│ [====]  │  Menüpunkt   │  └─────────────────────┘    │  Kommentare │
│         │              │                             │             │
│         │  - Files     │      Arbeitsbereich         │             │
│         │  - Dates     │      (scrollbar)            │             │
│         │  - Steps     │                             │             │
│         │              │  ┌─────────────────────┐    │             │
│         │              │  │ floating Footer     │    │             │
│         │              │  │ (Pagination etc.)   │    │             │
│         │              │  └─────────────────────┘    │             │
└─────────┴──────────────┴─────────────────────────────┴─────────────┘
```

### Spalte 1: Primärnavigation (Navbar)

- **Typ:** Fixierte Sidebar, resizable, collapsible
- **Inhalt:** Globaler Navigationsbaum (siehe Abschnitt 4)
- **Komponente:** Mehrstufiges Accordion mit Chevrons
- **Verhalten:** Kann auf "Icons only" minimiert werden
- **Breite:** Standard **15%** der Fensterbreite (~240px bei 1600px), minimiert ~48px

### Spalte 2: Kontext-Browser (Explorer)

- **Typ:** Optionales Panel, **vom Entwickler gesteuert**
- **Sichtbarkeit:** Entwickler entscheidet via `explorer` Prop, ob Panel angezeigt wird
- **User-Kontrolle:** User kann **nicht** ein-/ausblenden, aber **resizen**
- **Beziehung:** Gehört logisch zu Spalte 3 (Unternavigation/Filter)
- **Breadcrumbs:** Transparent (nicht in Breadcrumbs abgebildet)
- **Titel-Regel:** Entspricht automatisch dem aktiven Menüpunkt aus Spalte 1
- **Varianten:**
  - File Browser (mit Selection)
  - Date Browser (Jahr/Monat/Tag)
  - JSON-Struktur Browser
  - Stepper (für mehrstufige Prozesse)
  - Kapitel / Outline (für Texte / Dokumente)

```tsx
// Explorer aktiviert (vom Entwickler)
<AppShell explorer={<ExplorerPanel />}>
  <Content />
</AppShell>

// Explorer deaktiviert
<AppShell>
  <Content />
</AppShell>
```

### Spalte 3: Arbeitsfläche (Main Area)

- **Typ:** Flexibler Hauptbereich (`flex-grow`)
- **Floating Header:**
  - Position: `absolute top-4 left-4`, schwebt über scrollbarem Content
  - Komponente: `FloatingBreadcrumbs` mit Pill-Shape Design
  - Breadcrumbs automatisch aus Route + `navigationConfig` generiert
- **Floating Assist Actions:**
  - Position: `fixed top-4 right-4 z-50` - schwebt ÜBER allen Panels (auch Spalte 4)
  - Komponente: `FloatingAssistActions` mit Toggle-Buttons für Chat/Wiki/Comments/Cart
  - Bleibt sichtbar auch wenn AssistPanel geöffnet ist
- **Floating Footer:**
  - Position: `absolute bottom-4 left-4`
  - Komponenten: `FloatingPagination`, `FloatingNavigation` (optional)
- **Content:** Dashboards, Formulare, Tabellen, 3D-Viewer, Kanban, Gallery, Grid-View etc.

```tsx
// PageContent.tsx - Floating UI Elemente
<FloatingBreadcrumbs className="..." />
<FloatingAssistActions className="..." />
{showPagination && <FloatingPagination ... />}
{showNavigation && <FloatingNavigation ... />}
```

### Spalte 4: Assistenz-Leiste (AssistPanel)

- **Typ:** On-Demand Panel, **Squeeze-Modus** (kein Overlay!)
- **Steuerung:**
  - Aktivierung: Klick auf `FloatingAssistActions` Buttons (oben rechts, fixed)
  - Panel-Wechsel: Gleiche Buttons - aktives Panel wird hervorgehoben
  - Schließen: Erneuter Klick auf aktiven Button
- **UI-Struktur:**
  - **Kein Header/Tabs im Panel** - wird über FloatingAssistActions gesteuert
  - Nur TabsContent direkt im Panel
  - Content in Spalte 3 wird **nie verdeckt**, sondern zusammengeschoben
- **Inhalte (Tabs):**
  - Chat: AI-Chat Assistenz
  - Wiki: Kontextuelles Wiki / Lernen
  - Comments: Kommentare zu aktuellem Content
  - Cart: Warenkorb / Checkout

```tsx
// AssistPanel.tsx - nur TabsContent, keine UI-Controls
<Tabs value={activePanel} onValueChange={setPanel}>
  <TabsContent value="chat">...</TabsContent>
  <TabsContent value="wiki">...</TabsContent>
  <TabsContent value="comments">...</TabsContent>
  <TabsContent value="cart">...</TabsContent>
</Tabs>
```

---

## 3. Funktionale Anforderungen

### A. Scrollbars

- Custom Styling gemäß vorhandener `scroll-area.tsx` Komponente
- Standardmäßig unsichtbar (opacity: 0)
- Sichtbar bei: Scroll-Vorgang oder Hover über Container

### B. Rollen-basierte Sichtbarkeit (RBAC)

- Prinzip: "Code is always there, visibility is permissions"
- Alle Elemente werden gerendert
- Sichtbarkeit via Supabase Auth Rollen
- Helper: `<RoleGuard allow={['admin', 'editor']}>`

### C. Resizing & State Persistence

- User kann Spaltenbreiten per Drag ändern
- Zustand wird in LocalStorage persistiert:
  - Welche Panels sind offen
  - Spaltenbreiten
  - Collapsed-State der Navbar

### C.1 Pixel-basierte Panel-Breiten

Die Panel-Breiten werden intern in **Pixeln** gespeichert (nicht Prozent):

- **Warum:** Prozent-basierte Breiten verschieben sich, wenn Panels hinzugefügt/entfernt werden
- **Lösung:** Pixel-Werte werden dynamisch in Prozent umgerechnet basierend auf Container-Breite
- **Effekt:** Spalte 1+2 behalten ihre absoluten Breiten, wenn Spalte 4 getoggelt wird
- **Standard-Breite:** Alle optionalen Spalten (1, 2, 4) haben **15%** als Standardbreite

```typescript
// shell-context.tsx
export const DEFAULT_PANEL_WIDTHS = {
  navbar: 240, // 15% von ~1600px Fensterbreite
  navbarCollapsed: 48, // Icon-only
  explorer: 240, // 15% von ~1600px Fensterbreite
  assist: 240, // 15% von ~1600px Fensterbreite
} as const
```

### C.2 Smart Transition (On/Off-Schalter)

Die Navbar hat ein **"Snap to Collapsed"** Pattern mit **selektiver Animation**:

- **Problem:** Globale CSS-Transitions auf `[data-panel]` verursachen "Zucken" wenn Spalte 4 getoggelt wird
- **Lösung:** CSS-Klasse `.enable-panel-transition` die nur bei Keyboard-Shortcuts aktiviert wird

#### CSS-Regel (globals.css)

```css
/* NICHT: [data-panel] { transition: ... } - das zuckt! */
.enable-panel-transition [data-panel] {
  transition:
    flex-basis 200ms ease-out,
    flex-grow 200ms ease-out !important;
}
```

#### Zwei Interaktions-Modi

| Modus        | Trigger              | Transition    | Extra Logik                   |
| ------------ | -------------------- | ------------- | ----------------------------- |
| **Keyboard** | Cmd/Ctrl+B           | ✅ Ja (sanft) | `panel.collapse()`/`expand()` |
| **Drag**     | Resize-Handle ziehen | ❌ Nein       | Nur State-Update              |

#### Implementation (AppShell.tsx)

```typescript
// Flag um Drag von Keyboard zu unterscheiden
const isDragExpandingRef = useRef(false)

// Drag-Callback: KEINE Transition, KEINE extra panel.resize()
const handleNavbarExpand = useCallback(() => {
  isDragExpandingRef.current = true // Signal an useEffect
  setNavbarCollapsed(false) // Nur State updaten
}, [setNavbarCollapsed])

// Keyboard-Shortcut: MIT Transition
useEffect(() => {
  if (isDragExpandingRef.current) {
    isDragExpandingRef.current = false
    return // Skip - wurde durch Drag getriggert
  }
  // ... panel.collapse()/expand() mit Transition
}, [navbarCollapsed])
```

#### ⚠️ Wichtige Regeln

1. **Keine `transition-all` in Navbar-Komponenten** - verursacht Zucken bei Spalte-4-Toggle
2. **Drag-Callbacks minimal halten** - nur State updaten, keine `panel.resize()` Aufrufe
3. **CSS-Transition nur über Klasse** - nie global auf `[data-panel]` setzen

### C.3 Client-Only Navbar (Hydration Fix)

Die Navbar wird als **Client-Only** geladen wegen Radix UI Collapsibles:

```typescript
// layout.tsx
const Navbar = dynamic(() => import("@/components/shell").then((mod) => mod.Navbar), {
  ssr: false,
  loading: () => <div className="bg-sidebar h-full" />,
})
```

- **Warum:** Radix UI generiert dynamische IDs, die zwischen Server und Client unterschiedlich sind
- **Effekt:** Verhindert Hydration-Mismatch Fehler

### D. Theme-System (MUSS erhalten bleiben!)

- **Funktion:** TweakCN Theme-Import
- **Storage:** Themes in Supabase Storage
- **Features:**
  - Dynamisches Font-Loading (Google Fonts)
  - FOUC-Prevention (Server-Side Loading)
  - Dark/Light Mode via `next-themes`
- **UI-Zugang:** Account → Theme (Personalisierung)

### E. Breadcrumbs

- Automatisch generiert aus aktueller Route
- Beispiel: `/projekte/123/details` → "Projekte > 123 > Details"
- Spalte 2 ist transparent (nicht in Breadcrumbs)

---

## 4. Navigations-Struktur (Spalte 1)

Vier visuell getrennte Bereiche mit Dividers:

```
┌─────────────────────────────┐
│  App-Name                   │  ← Große Schrift, kein Menüpunkt
│                             │
├─────────────────────────────┤
│  Navpunkt 1                 │  ← Accordion (App-Content)
│    └─ Unterpunkt 1          │
│    └─ Unterpunkt 2          │
│    └─ Unterpunkt 3          │
│    └─ Unterpunkt 4          │
│                             │
│  Navpunkt 2                 │
│    └─ Unterpunkt 1          │
│    └─ Unterpunkt 2          │
│    └─ Unterpunkt 3          │
│    └─ Unterpunkt 4          │
│                             │
├─────────────────────────────┤  ← Divider
│  About the App              │  ← Accordion (App-Meta)
│    └─ App-Wiki              │
│    └─ Feature-Wishlist      │
│    └─ Co-Coding Request     │
│    └─ Bug-Report            │
│    └─ Impressum / Kontakt   │
│                             │
├─────────────────────────────┤  ← Divider
│  Account                    │  ← Accordion (User)
│    └─ User Details, PW      │
│    └─ Personalisierung      │  ← HIER: Theme-System!
│    └─ Payment-Options       │
│    └─ Users                 │
│    └─ Rollen                │
│    └─ Log out               │
└─────────────────────────────┘
```

### Bereich-Definitionen

| Bereich           | Zweck            | Inhalt                             |
| ----------------- | ---------------- | ---------------------------------- |
| **App-Name**      | Branding         | Großer Titel, optional Logo        |
| **App-Content**   | Hauptnavigation  | Dummy-Einträge (später ersetzt)    |
| **About the App** | Meta-Information | Wiki, Feature-Requests, Support    |
| **Account**       | User-bezogen     | Profil, **Theme**, Payment, Rollen |

---

## 5. Was wird archiviert

Folgende bestehende Strukturen werden archiviert (nicht gelöscht):

```
src/layouts/                    → src/_archive/layouts_v1/
src/app/(main)/                 → src/_archive/app_main_v1/
```

### Was wird NICHT archiviert (bleibt erhalten):

- `src/lib/themes/` – Theme-System
- `src/lib/fonts/` – Font-Loading
- `src/app/globals.css` – Design Tokens
- `src/components/ui/` – ShadCN Komponenten
- `src/components/ui/scroll-area.tsx` – Custom Scrollbar

### Was wird entfernt (nicht archiviert):

- Dashboard-Beispielseiten
- Layout-Showcase Pages
- Alte Archetyp-Demo-Seiten

---

## 6. Implementierungs-Checkliste (DoD)

### Phase 1: Grundstruktur

- [x] Alte App-Struktur archivieren
- [x] `RootLayout` mit `react-resizable-panels` (4 Panels)
- [x] Spalte 1: Navbar mit 4 Bereichen + Dividers
- [x] Spalte 3: Main Area mit floating Header/Footer

### Phase 2: Panels

- [x] Spalte 2: Explorer-Panel (on-demand)
- [x] Spalte 4: Assist-Panel (Squeeze-Modus)
- [x] Panel-State in LocalStorage persistieren
- [x] Pixel-basierte Panel-Breiten für Stabilität
- [x] Smart Transition (nur bei Navbar Collapse/Expand)

### Phase 3: Features

- [x] Breadcrumbs-Komponente (automatisch aus Route + navigationConfig)
- [x] FloatingBreadcrumbs mit Pill-Shape Design
- [x] FloatingAssistActions (fixed, schwebt über allen Panels)
- [x] Scrollbar-Styling (opacity: 0 default)
- [x] Navbar Collapse auf "Icons only" mit Animation
- [x] Keyboard Shortcuts (Cmd+B, Cmd+E, Cmd+J)

### Phase 4: Theme-Integration

- [x] Theme-System unter Account/Personalisierung
- [x] TweakCN Import funktioniert
- [x] Theme-Wechsel live

### Phase 5: Polish

- [ ] Mobile Responsive (Sheet-basiert)
- [x] Keyboard Navigation
- [ ] RBAC RoleGuard Komponente

---

## 7. Abgrenzung

### Was dieses Template IST:

- Eine wiederverwendbare App-Shell
- Basis für B2B-Anwendungen
- Konsistentes Layout mit Theme-System

### Was dieses Template NICHT IST:

- Eine fertige App mit Business-Logik
- Ein Dashboard-Template
- Eine Komponentenbibliothek (nutzt ShadCN)

- Allerdings: die Funktionalität von gewissen sich immer wiederholenden Bereiche soll implementiert werden.
  - der gesamte About the App-Bereich
  - der gesamte Account-Bereich, inkl Auth (Auth soll ins Layout vom Account bereich integriet werden. Falls kein User angemeldet ist, greift die Standardrolle "NoUser" und es werden nur die elemente gezeigt, die dort festgelegt sind)
