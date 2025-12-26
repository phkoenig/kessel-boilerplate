# ESLint Rules: AI Component Governance

Diese ESLint-Regeln erzwingen die korrekte Verwendung des AI-Interactable-Systems.

## Regeln

### `local/ai-component-compliance`

**Severity:** `error`

Prüft, dass jede `AIInteractable` Komponente im `ai-manifest.json` registriert ist.

```javascript
// ❌ Fehler
<AIInteractable id="unregistered-component" ...>

// ✅ OK
<AIInteractable id="registered-in-manifest" ...>
```

### `local/require-ai-wrapper`

**Severity:** `warn`

Prüft, dass interaktive UI-Komponenten (`Button`, `Input`, `Switch`, etc.) in `AIInteractable` gewrappt sind.

```javascript
// ⚠️ Warnung
<Button onClick={handleClick}>Klick mich</Button>

// ✅ OK: Mit AIInteractable
<AIInteractable id="my-button" action="trigger" ...>
  <Button onClick={handleClick}>Klick mich</Button>
</AIInteractable>

// ✅ OK: Explizit ausgenommen
<Button data-ai-exempt="true" onClick={handleClick}>
  Interner Button
</Button>
```

## Konfiguration

```javascript
// eslint.config.mjs
import aiComponentCompliance from "./eslint/rules/ai-component-compliance.js"
import requireAiWrapper from "./eslint/rules/require-ai-wrapper.js"

const localPlugin = {
  rules: {
    "ai-component-compliance": aiComponentCompliance,
    "require-ai-wrapper": requireAiWrapper,
  },
}

export default [
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/components/ui/**", "**/__tests__/**"],
    plugins: { local: localPlugin },
    rules: {
      "local/ai-component-compliance": "error",
      "local/require-ai-wrapper": "warn",
    },
  },
]
```

## Automatische Ausnahmen (require-ai-wrapper)

### Container-Ausnahmen

Elemente innerhalb dieser Container sind automatisch exempt:

- `DialogContent`
- `AlertDialogContent`
- `SheetContent`
- `DrawerContent`
- `PopoverContent`
- `DropdownMenuContent`
- `ContextMenuContent`

### Trigger-Ausnahmen

Kinder von Trigger-Komponenten sind automatisch exempt:

- `DialogTrigger`
- `AlertDialogTrigger`
- `SheetTrigger`
- `DropdownMenuTrigger`
- `CollapsibleTrigger`
- etc.

### Datei-Ausnahmen

Bestimmte Dateipfade sind automatisch exempt:

- `src/components/ui/**` (UI-Definitionen)
- `**/__tests__/**` (Tests)
- `**/*.stories.*` (Storybook)
- `/about/` (Info-Seiten)
- `/layout-templates/` (Demo-Templates)

## Interaktive Komponenten

Die Regel `require-ai-wrapper` prüft folgende Komponenten:

| Komponente  | Grund               |
| ----------- | ------------------- |
| `Button`    | Primäre Interaktion |
| `Input`     | Benutzereingabe     |
| `Switch`    | Toggle-Aktion       |
| `Checkbox`  | Auswahl             |
| `Select`    | Auswahl             |
| `Textarea`  | Texteingabe         |
| `Tabs`      | Navigation          |
| `Accordion` | Expandable Content  |

## Exemption-Strategien

### 1. Inline: `data-ai-exempt`

```tsx
<Button data-ai-exempt="true">Nicht für KI relevant</Button>
```

### 2. Automatisch: In exempted Containern

```tsx
<DialogContent>
  {/* Alle Buttons hier sind automatisch exempt */}
  <Button>Abbrechen</Button>
  <Button>OK</Button>
</DialogContent>
```

### 3. Datei-basiert: ESLint ignores

```javascript
{
  ignores: ["src/internal/**"],
}
```

## Manifest-Validierung

Zusätzlich zur ESLint-Regel gibt es einen Manifest-Validator:

```bash
node scripts/validate-ai-manifest.ts
```

Prüft:

- Schema-Konformität
- Keine doppelten IDs
- Keine unbenutzten Manifest-Einträge
- Alle Code-IDs sind registriert

## Fehlerbehebung

### "AIInteractable with id 'xyz' is not registered"

Füge die ID zum `ai-manifest.json` hinzu:

```json
{
  "components": [
    {
      "id": "xyz",
      "description": "Beschreibung der Aktion",
      "action": "trigger",
      "category": "actions",
      "keywords": ["keyword1", "keyword2"],
      "requiredRole": "user"
    }
  ]
}
```

### "Interactive component must be wrapped"

Option A: AIInteractable hinzufügen

```tsx
<AIInteractable id="my-button" action="trigger" ...>
  <Button>Klick</Button>
</AIInteractable>
```

Option B: Explicit exempt

```tsx
<Button data-ai-exempt="true">Klick</Button>
```
