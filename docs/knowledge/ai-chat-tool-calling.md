# AI Chat Tool-Calling mit Gemini

> Technische Dokumentation zur Implementierung von Tool-Calling im AI-Assistenten.

## Übersicht

Der AI-Assistent kann über Tool-Calling Aktionen ausführen. Das ermöglicht Abfragen wie "Zeige mir alle Benutzer" oder "Erstelle ein Projekt XYZ".

## Tech Stack

- **AI SDK**: `ai` v5.x (Vercel AI SDK)
- **Provider**: `@ai-sdk/google`
- **Modell**: `gemini-2.5-flash` (oder neuer)
- **Schema**: `zod` für Tool-Parameter

## Bekanntes Problem: streamText + Gemini + Tools

**Bug**: `streamText` mit Gemini und Tool-Calling führt dazu, dass `await result.text` nie resolved. Das SDK wartet auf einen Text-Response, der nach dem Tool-Call nicht kommt.

**Lösung**: `generateText` statt `streamText` verwenden.

```typescript
// ❌ FUNKTIONIERT NICHT mit Tools
const result = streamText({
  model: google("gemini-2.5-flash"),
  tools: myTools,
  // ...
})
const text = await result.text // Hängt ewig!

// ✅ FUNKTIONIERT
const result = await generateText({
  model: google("gemini-2.5-flash"),
  tools: myTools,
  // maxSteps ist in generateText nicht verfügbar (nur in streamText)
  // ...
})
console.log(result.text) // Text-Antwort
console.log(result.toolResults) // Tool-Ergebnisse
```

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend: AIChatPanel.tsx                                  │
│  - @assistant-ui/react mit ChatModelAdapter                 │
│  - Sendet POST an /api/chat                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API Route: /api/chat/route.ts                              │
│  - generateText() mit Gemini                                │
│  - Tools aus boilerplate-tools.ts                           │
│  - Formatiert Tool-Ergebnisse falls kein Text               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Tools: /lib/ai-chat/boilerplate-tools.ts                   │
│  - Beispiel-Tools (echo, get_timestamp, get_app_info)       │
│  - Erweiterbar für eigene Datenbank-Operationen             │
└─────────────────────────────────────────────────────────────┘
```

## Implementierung

### 1. Provider Setup (`src/lib/ai/google.ts`)

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
})
```

### 2. Tool Definition (`src/lib/ai-chat/boilerplate-tools.ts`)

**Wichtig für Gemini-Kompatibilität:**

- `z.string()` statt `z.enum()` in Parameter-Schemas
- Interne Enum-Validierung im `execute` Handler
- Default-Werte mit `.optional().describe("...")`

```typescript
import { z } from "zod"

export const boilerplateTools = {
  echo: {
    description: "Gibt die Eingabe zurück. Nützlich für Tests.",
    inputSchema: z.object({
      // WICHTIG: z.string() statt z.enum() für Gemini-Kompatibilität!
      message: z.string().describe("Die Nachricht"),
    }),
    execute: async ({ message }: { message: string }) => {
      return {
        success: true,
        data: { echo: message },
        message: `Echo: ${message}`,
      }
    },
  },
  // ... weitere Tools
}
```

### 3. API Route (`src/app/api/chat/route.ts`)

```typescript
import { generateText } from "ai"
import { google } from "@/lib/ai/google"
import { boilerplateTools, writeOperations } from "@/lib/ai-chat/boilerplate-tools"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
    tools: boilerplateTools,
  })

  let finalResponse = result.text || ""

  // Wenn kein Text, aber Tool-Ergebnisse vorhanden
  if (!finalResponse && result.toolResults?.length > 0) {
    const formatted = result.toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: tr.output ?? tr.result,
    }))
    finalResponse = formatToolResults(formatted)
  }

  // X-Database-Updated Header für Auto-Refresh
  const hasWriteOperation = result.toolResults?.some(
    (tr) => writeOperations.includes(tr.toolName) && tr.output?.success
  )

  const headers: HeadersInit = { "Content-Type": "text/plain" }
  if (hasWriteOperation) {
    headers["X-Database-Updated"] = "true"
  }

  return new Response(finalResponse, { headers })
}
```

## Eigene Tools hinzufügen

### 1. Tool in `boilerplate-tools.ts` definieren

```typescript
export const boilerplateTools = {
  // ... bestehende Tools

  list_users: {
    description: "Listet alle Benutzer auf.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Maximale Anzahl (Standard: 10)"),
    }),
    execute: async ({ limit }: { limit?: number }) => {
      const client = createSupabaseClient()
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .limit(limit || 10)

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        data: { users: data },
        count: data?.length || 0,
      }
    },
  },
}
```

### 2. Bei Write-Operations: `writeOperations` Array erweitern

```typescript
export const writeOperations: string[] = ["create_user", "update_user", "delete_user"]
```

### 3. Optional: `formatToolResults()` in der Route erweitern

```typescript
function formatToolResults(toolResults) {
  // ... Custom Formatting für spezifische Tools
}
```

## Auto-Refresh nach DB-Änderungen

### Wie es funktioniert

1. Tool mit Write-Operation wird ausgeführt
2. API setzt `X-Database-Updated: true` Header
3. AIChatPanel dispatched `database-updated` Event
4. Seiten-Komponenten reagieren mit `useDatabaseRefresh()` Hook

### Hook verwenden

```tsx
import { useDatabaseRefresh } from "@/hooks"

function MyPage() {
  // Standard: router.refresh()
  useDatabaseRefresh()

  // Oder: Custom Refresh-Logik
  useDatabaseRefresh(() => {
    queryClient.invalidateQueries(["users"])
  })

  return <div>...</div>
}
```

## Fallstricke & Lösungen

| Problem                                | Lösung                                    |
| -------------------------------------- | ----------------------------------------- |
| `streamText` hängt bei Tools           | `generateText` verwenden                  |
| `z.enum()` funktioniert nicht          | `z.string()` + interne Validierung        |
| Tool-Result ist `undefined`            | `.output` statt `.result` prüfen          |
| Gemini generiert keinen Text nach Tool | `formatToolResults()` als Fallback        |
| `tool()` Wrapper funktioniert nicht    | Plain objects mit `inputSchema` verwenden |
| `maxSteps` in `generateText`           | Nicht verfügbar, nur in `streamText`      |

## Environment Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

## Dateien

```
src/
├── app/api/chat/route.ts       # API Route mit generateText
├── lib/ai/
│   ├── google.ts               # Provider-Setup
│   └── index.ts                # Exports
├── lib/ai-chat/
│   ├── boilerplate-tools.ts    # Tool-Definitionen (HIER ERWEITERN!)
│   ├── types.ts                # TypeScript Types
│   └── wiki-content.ts         # Wiki-Loader für System-Prompt
├── hooks/
│   └── use-database-refresh.ts # Auto-Refresh Hook
└── components/shell/
    └── AIChatPanel.tsx         # Frontend-Komponente
```

## Referenzen

- [Vercel AI SDK - generateText](https://sdk.vercel.ai/docs/ai-sdk-core/generating-text)
- [Vercel AI SDK - Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Google Generative AI Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai)
