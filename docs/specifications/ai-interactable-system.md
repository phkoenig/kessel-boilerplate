# AI-Interactable Component System

Ein Framework zur Deklaration von KI-interaktiven UI-Komponenten mit automatischer Governance durch ESLint und Manifest-Validierung.

## Übersicht

Das AI-Interactable-System ermöglicht es, UI-Komponenten für KI-Assistenten "sichtbar" und steuerbar zu machen. Statt hardkodierter Tool-Definitionen werden Komponenten deklarativ mit Metadaten versehen, die zur Laufzeit dynamisch in KI-Tools umgewandelt werden.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ai-manifest.json ◄──── ESLint Rule ────► Component Code       │
│        │                     │                    │              │
│        │              validates against           │              │
│        │                     │                    │              │
│        └─────────────────────┴────────────────────┘              │
│                              │                                   │
│                         Build Gate                               │
│                              │                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                        RUNTIME                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                              ▼                                   │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│   │ AIRegistry  │ ◄── │AIInteractable│ ──► │ Context     │       │
│   │ (Client)    │     │ Components  │     │ Collector   │       │
│   └──────┬──────┘     └─────────────┘     └──────┬──────┘       │
│          │                                        │              │
│          │         ┌─────────────────┐           │              │
│          └────────►│   Chat API      │◄──────────┘              │
│                    │ (Dynamic Tools) │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  AI Assistant   │                          │
│                    │ (Tool Calling)  │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Komponenten

```bash
# AIInteractable Wrapper
src/components/ai/AIInteractable.tsx

# Registry Context
src/lib/ai/ai-registry-context.tsx

# Context Collector
src/lib/ai-chat/context-collector.ts
```

### 2. ESLint Regeln

```bash
# Manifest Compliance
eslint/rules/ai-component-compliance.js

# Wrapper Requirement
eslint/rules/require-ai-wrapper.js
```

### 3. Manifest

```bash
# Zentrale Komponenten-Definition
ai-manifest.json
```

## Verwendung

### Option 1: Inline AI-Props (BEVORZUGT)

Die UI-Komponenten haben eingebaute AI-Unterstützung. Setze einfach die `ai*` Props:

```tsx
import { Button } from "@/components/ui/button"

function MyComponent() {
  return (
    <Button
      onClick={handleClick}
      aiId="my-action-button"
      aiDescription="Führt meine Aktion aus"
      aiKeywords={["aktion", "button", "ausführen"]}
    >
      Aktion ausführen
    </Button>
  )
}
```

**Vorteile:**

- Weniger Boilerplate
- Komponente ist sofort AI-fähig
- Kein zusätzlicher Wrapper nötig
- Bessere Lesbarkeit

### Option 2: AIInteractable Wrapper (Legacy)

Der klassische Wrapper-Ansatz wird weiterhin unterstützt:

```tsx
import { AIInteractable } from "@/components/ai/AIInteractable"
import { Button } from "@/components/ui/button"

function MyComponent() {
  return (
    <AIInteractable
      id="my-action-button"
      action="trigger"
      target="my-action"
      description="Führt meine Aktion aus"
      keywords={["aktion", "button", "ausführen"]}
      category="actions"
    >
      <Button onClick={handleClick}>Aktion ausführen</Button>
    </AIInteractable>
  )
}
```

**Wann Wrapper verwenden:**

- Für komplexe Komponenten die nicht in `/components/ui/` sind
- Wenn mehrere Elemente zusammen eine AI-Aktion bilden

### Inline AI-Props (für UI-Komponenten)

| Prop            | Typ        | Pflicht | Beschreibung                                      |
| --------------- | ---------- | ------- | ------------------------------------------------- |
| `aiId`          | `string`   | ✅      | Eindeutige ID (muss im Manifest registriert sein) |
| `aiDescription` | `string`   | ✅      | Menschenlesbare Beschreibung für die KI           |
| `aiKeywords`    | `string[]` | ✅      | Suchbegriffe für KI-Erkennung                     |
| `aiAction`      | `string`   | ❌      | Aktionstyp (Default: je nach Komponente)          |
| `aiCategory`    | `string`   | ❌      | Kategorie (Default: je nach Komponente)           |
| `aiTarget`      | `string`   | ❌      | Ziel der Aktion (Route, Panel-Name, etc.)         |

**Defaults nach Komponententyp:**

- `Button`: action="trigger", category="actions"
- `Switch`: action="toggle", category="settings"
- `Select`: action="select", category="forms"
- `Input`: action="input", category="forms"

### AIInteractable Props (Legacy Wrapper)

| Prop          | Typ                                                              | Pflicht | Beschreibung                                        |
| ------------- | ---------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `id`          | `string`                                                         | ✅      | Eindeutige ID (muss im Manifest registriert sein)   |
| `action`      | `"navigate" \| "toggle" \| "trigger" \| "submit" \| "select"`    | ✅      | Aktionstyp                                          |
| `target`      | `string`                                                         | ❌      | Ziel der Aktion (Route, Panel-Name, etc.)           |
| `description` | `string`                                                         | ✅      | Menschenlesbare Beschreibung für die KI             |
| `keywords`    | `string[]`                                                       | ✅      | Suchbegriffe für KI-Erkennung                       |
| `category`    | `"navigation" \| "layout" \| "actions" \| "forms" \| "settings"` | ✅      | Komponenten-Kategorie                               |
| `isAvailable` | `boolean`                                                        | ❌      | Ist die Aktion aktuell verfügbar? (Default: `true`) |
| `className`   | `string`                                                         | ❌      | CSS-Klassen für den Wrapper                         |

### Aktionstypen

| Aktion     | Verwendung        | Beispiel                                 |
| ---------- | ----------------- | ---------------------------------------- |
| `navigate` | Seitennavigation  | Link zu `/settings`                      |
| `toggle`   | Ein-/Ausschalten  | Dark Mode Switch, Panel öffnen/schließen |
| `trigger`  | Einmalige Aktion  | Logout, Refresh                          |
| `submit`   | Formular absenden | Speichern, Senden                        |
| `select`   | Auswahl treffen   | Dropdown, Radio                          |

## Manifest (ai-manifest.json)

Das Manifest ist die Single Source of Truth für alle KI-interaktiven Komponenten:

```json
{
  "version": "1.0.0",
  "components": [
    {
      "id": "theme-dark-mode-toggle",
      "description": "Schaltet zwischen Dark Mode und Light Mode um",
      "action": "toggle",
      "target": "color-mode",
      "category": "settings",
      "keywords": ["dark mode", "light mode", "theme", "dunkel", "hell"],
      "requiredRole": "public",
      "route": "/account/design-system/theme-management"
    }
  ]
}
```

### Manifest-Felder

| Feld           | Typ        | Pflicht | Beschreibung                                                      |
| -------------- | ---------- | ------- | ----------------------------------------------------------------- |
| `id`           | `string`   | ✅      | Eindeutige Komponenten-ID                                         |
| `description`  | `string`   | ✅      | KI-lesbare Beschreibung                                           |
| `action`       | `string`   | ✅      | Aktionstyp                                                        |
| `target`       | `string`   | ❌      | Aktionsziel                                                       |
| `category`     | `string`   | ✅      | Komponenten-Kategorie                                             |
| `keywords`     | `string[]` | ✅      | Suchbegriffe (mind. 1)                                            |
| `requiredRole` | `string`   | ✅      | Benötigte Benutzerrolle                                           |
| `route`        | `string`   | ❌      | Seite, auf der die Komponente verfügbar ist (`"global"` oder URL) |

### Route-Feld

Das `route`-Feld ermöglicht **Cross-Page-Navigation**: Wenn eine Aktion auf einer anderen Seite liegt als der aktuellen, navigiert der AI-Chatbot automatisch dorthin, bevor die Aktion ausgeführt wird.

```json
// Global verfügbar (auf jeder Seite)
{ "id": "toggle-navbar", "route": "global" }

// Nur auf einer spezifischen Seite
{ "id": "theme-dark-mode-toggle", "route": "/account/design-system/theme-management" }
```

### Manifest-Speicherorte

> ⚠️ **WICHTIG**: Das Manifest existiert an zwei Orten und muss synchron gehalten werden!

| Ort                       | Verwendung                                   |
| ------------------------- | -------------------------------------------- |
| `ai-manifest.json` (Root) | Quelle für Entwicklung und Build-Validierung |
| `public/ai-manifest.json` | Wird vom Browser zur Runtime geladen         |

Nach Änderungen am Root-Manifest:

```bash
cp ai-manifest.json public/ai-manifest.json
```

## ESLint Regeln

### 1. `ai-component-compliance`

Prüft, dass jede `AIInteractable` Komponente im Manifest registriert ist.

```javascript
// ❌ Fehler: ID nicht im Manifest
<AIInteractable id="unregistered-id" ...>

// ✅ OK: ID im Manifest registriert
<AIInteractable id="theme-dark-mode-toggle" ...>
```

### 2. `require-ai-wrapper`

Prüft, dass interaktive UI-Komponenten AI-konfiguriert sind.

```javascript
// ❌ Fehler: Button ohne AI-Konfiguration
<Button onClick={handleClick}>Klick mich</Button>

// ✅ OK: Button mit Inline AI-Props (BEVORZUGT)
<Button
  onClick={handleClick}
  aiId="my-button"
  aiDescription="Führt Aktion aus"
  aiKeywords={["klick", "aktion"]}
>
  Klick mich
</Button>

// ✅ OK: Button mit AIInteractable (Legacy)
<AIInteractable id="my-button" ...>
  <Button onClick={handleClick}>Klick mich</Button>
</AIInteractable>

// ✅ OK: Explizit ausgenommen
<Button onClick={handleClick} data-ai-exempt="true">
  Interner Button
</Button>
```

### Automatische Ausnahmen

Folgende Kontexte sind automatisch von der `require-ai-wrapper` Regel ausgenommen:

| Kontext                               | Grund                                        |
| ------------------------------------- | -------------------------------------------- |
| `DialogContent`, `SheetContent`, etc. | Modal-Inhalte sind nicht direkt KI-steuerbar |
| `AlertDialogTrigger > Button`         | Kinder von Triggern sind Teil des Triggers   |
| `/components/ui/`                     | UI-Definitionen selbst                       |
| `/about/`, `/layout-templates/`       | Demo/Info-Seiten                             |
| `*.test.tsx`, `*.stories.tsx`         | Test- und Story-Dateien                      |

## Validierung

### Build-Zeit Validierung

```bash
# In package.json
{
  "scripts": {
    "lint": "eslint . && node scripts/validate-ai-manifest.ts",
    "build": "pnpm lint && next build"
  }
}
```

### Manifest-Validator

Der `validate-ai-manifest.ts` Script prüft:

- ✅ Schema-Konformität (Zod-Validierung)
- ✅ Keine doppelten IDs
- ✅ Keine doppelten Keywords (Warnung)
- ✅ Alle IDs im Code werden verwendet
- ✅ Keine fehlenden Manifest-Einträge

## Runtime-Flow

### 1. Client-Side Registration

```typescript
// AIInteractable registriert sich beim Mount
useEffect(() => {
  const unregister = registerAction({
    id,
    action,
    target,
    description,
    keywords,
    category,
    isAvailable: true,
    execute: () => handleAction(),
  })
  return unregister
}, [])
```

### 2. Context Collection

```typescript
// Vor dem Chat-Request werden Actions gesammelt
const actions = collectAvailableActions()
// → [{id, action, target, description, keywords}, ...]
```

### 3. Dynamic Tool Generation

```typescript
// Server generiert Tools aus Actions
const tools = generateUIActionTool(availableActions)
// → execute_ui_action Tool mit allen verfügbaren Actions
```

### 4. Tool Execution (mit Cross-Page-Navigation)

```typescript
// Bei Tool-Call wird geprüft, ob Navigation nötig ist
// Dies passiert in handleToolCall() - VOR dem Text-Streaming!

// Fall 1: Action ist lokal verfügbar
if (localActions.includes(actionId)) {
  window.aiRegistry.executeAction(actionId)
}

// Fall 2: Action ist auf anderer Seite (route im Manifest)
if (manifestAction.route !== currentPath) {
  // 1. Speichere pending action in sessionStorage
  sessionStorage.setItem("pendingUIAction", JSON.stringify({ actionId, timestamp }))

  // 2. Navigiere sofort (vor Text-Streaming!)
  router.push(manifestAction.route)

  // 3. Nach Navigation: Polling bis Komponente registriert ist
  // → Dann wird executeAction aufgerufen
}
```

### 5. Cross-Page-Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User: "Aktiviere Dark Mode"                                     │
├─────────────────────────────────────────────────────────────────┤
│ 1. handleToolCall() wird aufgerufen (vor Text-Streaming!)       │
│    └─► Action "theme-dark-mode-toggle" erkannt                  │
│                                                                  │
│ 2. Prüfe: Ist Action lokal verfügbar?                           │
│    └─► NEIN (User ist auf "/" aber Action ist auf "/theme")     │
│                                                                  │
│ 3. Lade Route aus Manifest                                       │
│    └─► route: "/account/design-system/theme-management"         │
│                                                                  │
│ 4. Speichere pending action + Navigiere SOFORT                  │
│    └─► sessionStorage.setItem("pendingUIAction", ...)           │
│    └─► router.push("/account/design-system/theme-management")   │
│                                                                  │
│ 5. Nach Navigation: Polling (max 5 Sekunden)                    │
│    └─► Warte bis AIInteractable sich registriert hat            │
│    └─► Führe executeAction() aus                                │
│                                                                  │
│ 6. Text-Streaming zeigt Erfolgsmeldung                          │
│    └─► "Dark Mode wurde aktiviert" (NACH dem visuellen Effekt!) │
└─────────────────────────────────────────────────────────────────┘
```

> **Wichtig**: Die Navigation passiert in `handleToolCall()` (nicht in `handleFinish()`), damit der visuelle Effekt **vor** der Textnachricht erscheint.

## Best Practices

### Keywords

```typescript
// ❌ Zu generisch
keywords: ["button", "click"]

// ✅ Spezifisch und mehrsprachig
keywords: ["dark mode", "light mode", "theme", "dunkel", "hell", "nachtmodus"]
```

### Beschreibungen

```typescript
// ❌ Technisch
description: "Toggles the isDarkMode state"

// ✅ Natürlich, KI-freundlich
description: "Schaltet zwischen Dark Mode und Light Mode um"
```

### Kategorisierung

```typescript
// Navigation: Seitenwechsel
category: "navigation"

// Layout: UI-Panels, Sidebars
category: "layout"

// Settings: Benutzereinstellungen
category: "settings"

// Actions: Einmalige Aktionen
category: "actions"

// Forms: Formulare
category: "forms"
```

## Exemption-Strategien

### 1. Inline-Exemption

```tsx
<Button data-ai-exempt="true">Interner Button</Button>
```

### 2. Datei-basierte Exemption (ESLint Config)

```javascript
// eslint.config.mjs
{
  files: ["src/**/*.tsx"],
  ignores: ["src/components/internal/**"],
  rules: {
    "local/require-ai-wrapper": "warn",
  },
}
```

### 3. Automatische Exemption (in der Regel)

```javascript
// eslint/rules/require-ai-wrapper.js
function isDemoOrAboutPage(filename) {
  return filename.includes("/layout-templates/") || filename.includes("/about/")
}
```

## Migration Guide

### Von ungwrappten Komponenten zu AI-Interactable

1. **Lint ausführen**: `pnpm lint` zeigt alle fehlenden Wrapper
2. **Kategorisieren**: KI-relevant vs. exempt
3. **Wrappen oder Exempt**:
   - KI-relevant → `AIInteractable` + Manifest-Eintrag
   - Nicht relevant → `data-ai-exempt="true"`
4. **Manifest aktualisieren**: Neue IDs hinzufügen
5. **Validieren**: `pnpm build` prüft alles

## Troubleshooting

### "AIInteractable with id 'xyz' is not registered"

→ ID zum Manifest hinzufügen

### "Interactive component must be wrapped"

→ `AIInteractable` wrappen oder `data-ai-exempt="true"` setzen

### "Keyword 'xyz' wird von mehreren Komponenten verwendet"

→ Keywords eindeutiger machen (Warnung, kein Fehler)

### Tool wird nicht aufgerufen

1. Prüfe ob Komponente gerendert ist (DevTools)
2. Prüfe Registry: `window.aiRegistry.getAvailableActions()`
3. Prüfe Network-Request: `availableActions` sollte die ID enthalten

### Cross-Page-Navigation funktioniert nicht

1. **Prüfe `route` im Manifest**: Ist die Route korrekt gesetzt?

   ```bash
   cat ai-manifest.json | grep -A 5 "theme-dark-mode-toggle"
   ```

2. **Prüfe `public/ai-manifest.json`**: Ist es synchron mit dem Root-Manifest?

   ```bash
   diff ai-manifest.json public/ai-manifest.json
   # Wenn unterschiedlich:
   cp ai-manifest.json public/ai-manifest.json
   ```

3. **Prüfe Console-Logs**: Suche nach `[AIChatPanel]` Logs
   - `✅ UI-Action detected in tool call!` → Action erkannt
   - `Action not locally available, checking manifest...` → Suche im Manifest
   - `Found manifestAction: {...}` → Manifest-Eintrag gefunden (mit `route`?)
   - `🚀 Immediate navigation to:` → Navigation wird ausgelöst
   - `⚠️ Action not found in manifest` → Route fehlt!

4. **Prüfe Polling nach Navigation**:
   - `Action found in registry after X polls` → Erfolgreich
   - `Timeout waiting for action` → Komponente rendert nicht

### Aktion wird erst nach Text-Streaming ausgeführt

→ Prüfe, dass die Navigation in `handleToolCall()` passiert, nicht in `handleFinish()`.

Console-Log-Reihenfolge sollte sein:

1. `[AIChatPanel] ===== handleToolCall CALLED =====`
2. `[AIChatPanel] 🚀 Immediate navigation to: ...`
3. `[AIChatPanel] ===== handleFinish CALLED =====` (danach)

Falls Navigation in `handleFinish` passiert, ist das `route`-Feld nicht im geladenen Manifest.

## Referenzen

- [AIInteractable Component](../src/components/ai/AIInteractable.tsx)
- [AI Registry Context](../src/lib/ai/ai-registry-context.tsx)
- [ESLint Rule: require-ai-wrapper](../eslint/rules/require-ai-wrapper.js)
- [ESLint Rule: ai-component-compliance](../eslint/rules/ai-component-compliance.js)
- [Manifest Schema](../src/lib/ai/ai-manifest.schema.ts)
