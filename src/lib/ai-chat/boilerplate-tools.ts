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
  //
  // Beispiel für ein Datenbank-Tool:
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
