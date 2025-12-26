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

### AIInteractable Wrapper

Wrappe interaktive UI-Komponenten mit `AIInteractable`:

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

### Props

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
      "requiredRole": "public"
    }
  ]
}
```

### Manifest-Felder

| Feld           | Typ        | Pflicht | Beschreibung              |
| -------------- | ---------- | ------- | ------------------------- |
| `id`           | `string`   | ✅      | Eindeutige Komponenten-ID |
| `description`  | `string`   | ✅      | KI-lesbare Beschreibung   |
| `action`       | `string`   | ✅      | Aktionstyp                |
| `target`       | `string`   | ❌      | Aktionsziel               |
| `category`     | `string`   | ✅      | Komponenten-Kategorie     |
| `keywords`     | `string[]` | ✅      | Suchbegriffe (mind. 1)    |
| `requiredRole` | `string`   | ✅      | Benötigte Benutzerrolle   |

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

Prüft, dass interaktive UI-Komponenten in `AIInteractable` gewrappt sind.

```javascript
// ❌ Warnung: Button ohne Wrapper
<Button onClick={handleClick}>Klick mich</Button>

// ✅ OK: Button mit AIInteractable
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

### 4. Tool Execution

```typescript
// Bei Tool-Call wird Action auf Client ausgeführt
window.aiRegistry.executeAction(actionId)
```

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

## Referenzen

- [AIInteractable Component](../src/components/ai/AIInteractable.tsx)
- [AI Registry Context](../src/lib/ai/ai-registry-context.tsx)
- [ESLint Rule: require-ai-wrapper](../eslint/rules/require-ai-wrapper.js)
- [ESLint Rule: ai-component-compliance](../eslint/rules/ai-component-compliance.js)
- [Manifest Schema](../src/lib/ai/ai-manifest.schema.ts)
