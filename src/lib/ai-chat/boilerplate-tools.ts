/**
 * Boilerplate Tools für AI Chat
 *
 * Template für Tool-Calling Funktionalitäten im KI-Chat.
 * Definiert beispielhafte Tools die der KI-Chat verwenden kann.
 *
 * ## Eigene Tools hinzufügen
 *
 * 1. Tool-Definition hier hinzufügen (siehe Beispiele unten)
 * 2. In `/api/chat/route.ts` importieren und an `generateText` übergeben
 * 3. Optional: `formatToolResults()` in der Route erweitern
 *
 * ## WICHTIG: Gemini-Kompatibilität
 *
 * - Verwende `z.string()` statt `z.enum()` in Parameter-Schemas
 * - Die Enum-Validierung erfolgt intern im execute-Handler
 * - Default-Werte mit `.optional().describe("...")` dokumentieren
 *
 * ## Navigation-Trigger (NEU!)
 *
 * Tools können mit `metadata.affectsNavigation: true` markiert werden,
 * um automatisch eine Follow-up-Frage zu triggern, ob ein Navigation-Eintrag
 * erstellt werden soll. Siehe `create_resource_example` für ein Beispiel.
 *
 * @example
 * ```typescript
 * // In /api/chat/route.ts
 * import { boilerplateTools } from "@/lib/ai-chat/boilerplate-tools"
 *
 * const result = await generateText({
 *   model: google("gemini-2.5-flash"),
 *   tools: boilerplateTools,
 *   // ...
 * })
 * ```
 */

import { z } from "zod"
import type { ToolMetadata, NavigationAwareToolResult, NavigationSuggestion } from "@/lib/ai/types"
import { labelToSlug } from "@/lib/navigation/utils"

/**
 * Beispiel-Tool Response Type für typsichere Ergebnisse
 */
export interface ToolResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
  message?: string
}

/**
 * Boilerplate Tools - Sammlung aller verfügbaren Tools
 *
 * Jedes Tool hat:
 * - `description`: Beschreibung für das LLM
 * - `inputSchema`: Zod-Schema für Parameter (WICHTIG: z.string() statt z.enum() für Gemini!)
 * - `execute`: Async-Funktion die das Tool ausführt
 */
export const boilerplateTools = {
  /**
   * Beispiel: Echo-Tool (für Tests)
   *
   * Gibt die Eingabe zurück. Nützlich um Tool-Calling zu testen.
   */
  echo: {
    description: "Gibt die Eingabe zurück. Nützlich für Tests.",
    inputSchema: z.object({
      message: z.string().describe("Die Nachricht die zurückgegeben werden soll"),
    }),
    execute: async ({ message }: { message: string }): Promise<ToolResponse<{ echo: string }>> => {
      console.log("[BOILERPLATE TOOLS] echo aufgerufen mit:", message)
      return {
        success: true,
        data: { echo: message },
        message: `Echo: ${message}`,
      }
    },
  },

  /**
   * Beispiel: Zeitstempel-Tool
   *
   * Gibt den aktuellen Zeitstempel zurück.
   */
  get_timestamp: {
    description: "Gibt den aktuellen Zeitstempel zurück.",
    inputSchema: z.object({
      format: z
        .string()
        .optional()
        .describe("Format: 'iso' für ISO-String (Standard), 'unix' für Unix-Timestamp"),
    }),
    execute: async ({
      format,
    }: {
      format?: string
    }): Promise<ToolResponse<{ timestamp: string | number }>> => {
      const now = new Date()
      const effectiveFormat = format || "iso"

      if (effectiveFormat === "unix") {
        return {
          success: true,
          data: { timestamp: Math.floor(now.getTime() / 1000) },
          message: `Unix-Timestamp: ${Math.floor(now.getTime() / 1000)}`,
        }
      }

      return {
        success: true,
        data: { timestamp: now.toISOString() },
        message: `ISO-Zeitstempel: ${now.toISOString()}`,
      }
    },
  },

  /**
   * Beispiel: App-Info Tool
   *
   * Gibt Informationen über die Anwendung zurück.
   */
  get_app_info: {
    description: "Gibt Informationen über die Anwendung zurück (Version, Name, Environment).",
    inputSchema: z.object({}),
    execute: async (): Promise<
      ToolResponse<{ name: string; version: string; environment: string }>
    > => {
      return {
        success: true,
        data: {
          name: "Kessel Boilerplate",
          version: process.env.npm_package_version || "0.1.0",
          environment: process.env.NODE_ENV || "development",
        },
        message: "App-Informationen abgerufen.",
      }
    },
  },

  // ============================================================
  // HIER EIGENE TOOLS HINZUFÜGEN
  // ============================================================

  /**
   * BEISPIEL: Tool mit Navigation-Trigger
   *
   * Dieses Tool demonstriert, wie man ein Tool erstellt, das nach
   * erfolgreicher Ausführung vorschlägt, einen Navigation-Eintrag anzulegen.
   *
   * Nach Ausführung fragt die AI den User:
   * "Soll ich auch einen Navigation-Eintrag für [Name] anlegen?"
   *
   * Bei Zustimmung wird automatisch:
   * 1. Ein Eintrag in navigation.ts erstellt
   * 2. Eine page.tsx im entsprechenden Verzeichnis erstellt
   *
   * HINWEIS: Das Navigation-Tool funktioniert nur im Development-Modus!
   */
  create_resource_example: {
    description:
      "Beispiel-Tool das eine neue Ressource erstellt. " +
      "Demonstriert den Navigation-Trigger. Nach Erstellung wird gefragt, " +
      "ob ein Navigation-Eintrag erstellt werden soll.",
    inputSchema: z.object({
      name: z.string().describe("Name der neuen Ressource"),
      description: z.string().optional().describe("Optionale Beschreibung"),
    }),
    // Metadata für Navigation-Trigger
    metadata: {
      affectsNavigation: true,
      category: "example",
      isWriteOperation: true,
      navigationSuggestion: (
        args: { name: string },
        result: { success: boolean }
      ): NavigationSuggestion | null => {
        if (!result.success) return null
        return {
          parentPath: "/module-1", // Passe an deine Navigation an
          suggestedLabel: args.name,
          suggestedId: `module-1-${labelToSlug(args.name)}`,
          icon: "FileText",
        }
      },
    } as ToolMetadata,
    execute: async ({
      name,
      description,
    }: {
      name: string
      description?: string
    }): Promise<NavigationAwareToolResult> => {
      console.log("[BOILERPLATE TOOLS] create_resource_example aufgerufen:", name)

      // Hier würde normalerweise die Ressource erstellt werden
      // z.B. Datenbank-Eintrag, API-Call, etc.

      // Simuliere erfolgreiche Erstellung
      const resourceId = `res-${Date.now()}`

      // Navigation-Suggestion im Result zurückgeben
      const navigationSuggestion: NavigationSuggestion = {
        parentPath: "/module-1", // Passe an deine Navigation an
        suggestedLabel: name,
        suggestedId: `module-1-${labelToSlug(name)}`,
        icon: "FileText",
        description: description || `Seite für ${name}`,
      }

      return {
        success: true,
        data: {
          id: resourceId,
          name,
          description,
          createdAt: new Date().toISOString(),
        },
        message: `Ressource "${name}" wurde erfolgreich erstellt (ID: ${resourceId}).`,
        navigationSuggestion,
      }
    },
  },

  // Weiteres Beispiel für ein Datenbank-Tool (auskommentiert):
  //
  // list_users: {
  //   description: "Listet alle Benutzer auf.",
  //   inputSchema: z.object({
  //     limit: z.number().optional().describe("Maximale Anzahl (Standard: 10)"),
  //   }),
  //   execute: async ({ limit }: { limit?: number }) => {
  //     const client = createSupabaseClient()
  //     const { data, error } = await client
  //       .from("profiles")
  //       .select("*")
  //       .limit(limit || 10)
  //
  //     if (error) {
  //       return { success: false, error: error.message }
  //     }
  //
  //     return {
  //       success: true,
  //       data: { users: data },
  //       count: data?.length || 0,
  //     }
  //   },
  // },
}

/**
 * Liste aller Write-Operations für Refresh-Detection.
 *
 * Wenn ein Tool in dieser Liste erfolgreich ausgeführt wird,
 * sendet die API einen `X-Database-Updated` Header.
 *
 * Füge hier Tool-Namen hinzu die Daten ändern (CREATE, UPDATE, DELETE).
 */
export const writeOperations: string[] = [
  // Beispiele:
  // "create_user",
  // "update_user",
  // "delete_user",
]

/**
 * Type für Tool-Namen (für TypeScript Autocomplete)
 */
export type BoilerplateToolName = keyof typeof boilerplateTools
