# AI-Interactable Component System - ShadCN PR Pitch

## TL;DR

Ein System, das ShadCN-Komponenten für KI-Assistenten "sichtbar" macht, ohne die Komponenten selbst zu ändern.

## Problem

KI-Assistenten (ChatGPT, Claude, etc.) können UI nicht verstehen ohne:

- Screenshots + Vision Models (teuer, langsam)
- Hardkodierte Tool-Definitionen (nicht skalierbar)

## Lösung: Deklarativer AI-Layer

```tsx
// Wrapper macht jede Komponente KI-steuerbar
<AIInteractable
  id="theme-dark-mode-toggle"
  action="toggle"
  description="Schaltet zwischen Dark Mode und Light Mode"
  keywords={["dark mode", "theme", "dunkel"]}
  category="settings"
>
  <Switch checked={isDarkMode} onCheckedChange={toggle} />
</AIInteractable>
```

## Vorteile

1. **Zero Breaking Changes**: Nur ein Wrapper, keine Änderung an bestehenden Komponenten
2. **Opt-in per Komponente**: Entwickler entscheiden, was KI-steuerbar ist
3. **Build-Zeit Governance**: ESLint verhindert "vergessene" Komponenten
4. **Runtime Dynamic**: Tools werden zur Laufzeit aus Registry generiert
5. **Keyword-basierte Suche**: KI findet Komponenten via natürliche Sprache

## Komponenten

### 1. `AIInteractable` Wrapper (React)

```tsx
export function AIInteractable({ id, action, target, description, keywords, category, children }) {
  const { register } = useAIRegistry()

  useEffect(() => {
    return register({
      id,
      action,
      target,
      description,
      keywords,
      category,
      execute: () => findAndClick(elementRef.current),
    })
  }, [])

  return (
    <div ref={elementRef} data-ai-id={id} data-ai-action={action}>
      {children}
    </div>
  )
}
```

### 2. `ai-manifest.json` (Single Source of Truth)

```json
{
  "components": [
    {
      "id": "theme-dark-mode-toggle",
      "description": "Schaltet zwischen Dark Mode und Light Mode",
      "action": "toggle",
      "keywords": ["dark mode", "light mode", "theme"],
      "category": "settings",
      "requiredRole": "public",
      "route": "/account/design-system/theme-management"
    }
  ]
}
```

Das `route`-Feld ermöglicht **Cross-Page-Navigation**: KI kann Aktionen auf anderen Seiten ausführen!

### 3. ESLint Rules

```javascript
// ai-component-compliance: Manifest-Registrierung
// ❌ "AIInteractable id 'xyz' not in manifest"

// require-ai-wrapper: Wrapper-Pflicht
// ⚠️ "<Button> must be wrapped in <AIInteractable>"
```

## Flow

```
Build Time:
  ai-manifest.json ◄── ESLint ──► Code (AIInteractable usage)
                          ↓
                     Build Gate

Runtime:
  AIInteractable ──► AIRegistry ──► Context Collector
                                          ↓
                               Chat API (Dynamic Tools)
                                          ↓
                               AI Assistant (Tool Call)
                                          ↓
                               Client (executeAction)
```

## Demo

```
User: "Schalte den Dark Mode ein"

AI: → execute_ui_action({ action_id: "theme-dark-mode-toggle" })

# Cross-Page-Navigation (wenn User nicht auf der Theme-Seite ist):
1. handleToolCall() erkennt Action
2. Prüft: Action lokal verfügbar? → NEIN
3. Lädt route aus Manifest: "/account/design-system/theme-management"
4. Navigiert SOFORT (vor Text-Streaming!)
5. Pollt bis AIInteractable registriert ist
6. Führt executeAction() aus
7. Text-Streaming zeigt: "Dark Mode aktiviert"

← Success: Dark Mode sichtbar BEVOR die Nachricht erscheint!
```

### Timing ist entscheidend

Die Navigation passiert in `handleToolCall()` (nicht `handleFinish()`), damit:

- ✅ Visueller Effekt erscheint **vor** der Textnachricht
- ✅ User sieht die Änderung sofort
- ❌ Nicht: Text zuerst, dann erst die Änderung (schlechte UX)

## Exemption-Strategien

```tsx
// 1. Inline
<Button data-ai-exempt="true">Interner Button</Button>

// 2. Container-basiert (automatisch)
<DialogContent>
  <Button>Abbrechen</Button>  {/* Auto-exempt */}
</DialogContent>

// 3. Datei-basiert (ESLint)
ignores: ["src/internal/**"]
```

## Integration mit ShadCN

### Option A: Separate Package

```bash
npm install @shadcn/ai-interactable
```

### Option B: CLI-Option

```bash
npx shadcn@latest add button --with-ai
# Generiert AIInteractable-Wrapper automatisch
```

### Option C: Theme/Config

```typescript
// components.json
{
  "ai": {
    "enabled": true,
    "manifestPath": "./ai-manifest.json"
  }
}
```

## Integration mit assistant-ui

Das System wurde mit [assistant-ui](https://www.assistant-ui.com/) getestet und funktioniert nahtlos:

```typescript
// useChatRuntime mit onToolCall für sofortige Navigation
const runtime = useChatRuntime({
  transport: chatTransport,
  onToolCall: handleToolCall, // Hier passiert die Navigation!
  onFinish: handleFinish, // Hier nur noch Cleanup
})
```

**Wichtig**: assistant-ui sendet `toolCall.input`, nicht `toolCall.args`:

```typescript
// ❌ Funktioniert nicht
const args = toolCall.args as { action_id?: string }

// ✅ Richtig
const inputData = (toolCall.input ?? toolCall.args) as { action_id?: string }
```

## Open Questions

1. Soll `AIInteractable` Teil von ShadCN/UI sein oder separates Package?
2. Wie umgehen mit Accessibility-Überschneidungen (aria-label vs. description)?
3. Sollte das Manifest-Format standardisiert werden (JSON Schema)?
4. Wie integriert sich das mit bestehenden AI-Frameworks (Vercel AI SDK, LangChain)?
5. **NEU**: Sollte `route` automatisch aus dem Dateipfad inferiert werden?
6. **NEU**: Wie handhabt man dynamische Routen (`/users/[id]`)?

## Links

- [Vollständige Dokumentation](./ai-interactable-system.md)
- [ESLint Rules README](../eslint/rules/README.md)
- [AIInteractable Component](../src/components/ai/AIInteractable.tsx)
- [AI Registry Context](../src/lib/ai/ai-registry-context.tsx)

## Feedback

Ich freue mich über Feedback! Hauptfragen:

1. Ist der Ansatz sinnvoll für ShadCN?
2. Was sollte vereinfacht/geändert werden?
3. Gibt es Bedenken bzgl. Performance/Bundle Size?
