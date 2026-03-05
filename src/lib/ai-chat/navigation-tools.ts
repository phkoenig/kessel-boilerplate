/**
 * Navigation Tools für AI Chat
 *
 * Tools für die Verwaltung von Navigation-Einträgen und Seiten.
 * Ermöglicht dem AI-Chat, neue Navigation-Einträge hinzuzufügen.
 *
 * @module lib/ai-chat/navigation-tools
 */

import { z } from "zod"
import { tool } from "ai"

import type { NavigationSuggestion, ToolMetadata } from "@/lib/ai/types/tool-metadata"
import { labelToSlug } from "@/lib/navigation/utils"

/**
 * Response-Typ für Navigation-Tools
 */
export interface NavigationToolResponse {
  success: boolean
  error?: string
  message?: string
  createdFiles?: string[]
  modifiedFiles?: string[]
  generatedHref?: string
}

/**
 * Input-Schema für das add_navigation_entry Tool
 */
const AddNavigationEntrySchema = z.object({
  parentPath: z
    .string()
    .describe(
      "Pfad des Parent-Navigation-Items, unter dem der neue Eintrag erstellt werden soll. " +
        "Beispiele: '/galaxy/kataloge', '/galaxy/projekte', '/galaxy/ordnerstruktur'"
    ),
  label: z
    .string()
    .min(2)
    .describe(
      "Anzeige-Label für den neuen Navigation-Eintrag. " +
        "Beispiele: 'DIN 276', 'Neue Kategorie', 'Mein Katalog'"
    ),
  icon: z
    .string()
    .optional()
    .describe(
      "Lucide Icon Name im PascalCase. " +
        "Beispiele: 'BookMarked', 'FileText', 'FolderTree', 'Database'. " +
        "Wenn nicht angegeben, wird 'FileText' verwendet."
    ),
  description: z
    .string()
    .optional()
    .describe("Optionale Beschreibung für die neue Seite. " + "Wird im PageHeader angezeigt."),
})

/**
 * Typ für die Tool-Input-Parameter
 */
type AddNavigationEntryInput = z.infer<typeof AddNavigationEntrySchema>

/**
 * Generiert eine ID aus parentPath und label
 */
function generateNavItemId(parentPath: string, label: string): string {
  // Extrahiere den Pfad-Teil (z.B. "/galaxy/kataloge" -> "galaxy-kataloge")
  const pathPart = parentPath.split("/").filter(Boolean).join("-")

  // Füge den Label-Slug hinzu
  const labelSlug = labelToSlug(label)

  return `${pathPart}-${labelSlug}`
}

/**
 * Navigation-Tool Metadaten
 *
 * Das add_navigation_entry Tool ist selbst ein Write-Operation,
 * das die Navigation modifiziert.
 */
export const navigationToolMetadata: ToolMetadata = {
  category: "navigation",
  isWriteOperation: true,
  requiresReload: true,
}

/**
 * add_navigation_entry Tool Definition (Plain Object)
 *
 * Fügt einen neuen Navigation-Eintrag hinzu und erstellt die zugehörige Seite.
 * Ruft die /api/navigation/update API auf.
 */
export const addNavigationEntryToolDef = {
  description:
    "Fügt einen neuen Navigation-Eintrag in der Sidebar hinzu und erstellt automatisch " +
    "die zugehörige Seite (page.tsx). Verwende dieses Tool wenn der User bestätigt, " +
    "dass ein neuer Menüpunkt erstellt werden soll. " +
    "WICHTIG: Dieses Tool funktioniert nur im Entwicklungsmodus!",
  inputSchema: AddNavigationEntrySchema,
  metadata: navigationToolMetadata,
  execute: async (args: AddNavigationEntryInput): Promise<NavigationToolResponse> => {
    console.log("[NAVIGATION TOOLS] add_navigation_entry aufgerufen mit:", args)

    try {
      // Generiere die ID
      const suggestedId = generateNavItemId(args.parentPath, args.label)

      // Baue die Request-Daten
      const requestBody: NavigationSuggestion = {
        parentPath: args.parentPath,
        suggestedLabel: args.label,
        suggestedId,
        icon: args.icon,
        description: args.description,
      }

      // Rufe die API auf
      // In Server-Side-Context verwenden wir fetch mit absolutem Pfad
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const response = await fetch(`${baseUrl}/api/navigation/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Unbekannter Fehler",
          message: result.details?.join(", ") || result.error,
        }
      }

      return {
        success: true,
        message: result.message,
        createdFiles: result.createdFiles,
        modifiedFiles: result.modifiedFiles,
        generatedHref: result.generatedHref,
      }
    } catch (error) {
      console.error("[NAVIGATION TOOLS] Fehler:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      }
    }
  },
}

/**
 * add_navigation_entry Tool (AI SDK tool() Wrapper)
 *
 * Für Verwendung mit generateText/streamText.
 */
export const addNavigationEntryTool = tool({
  description: addNavigationEntryToolDef.description,
  parameters: AddNavigationEntrySchema,
  execute: addNavigationEntryToolDef.execute,
})

/**
 * Navigation Tools ToolSet
 *
 * Sammlung aller Navigation-Tools für die Verwendung in der Chat-API.
 */
export const navigationTools = {
  add_navigation_entry: addNavigationEntryToolDef,
}

/**
 * Generiert das AI SDK ToolSet für Navigation-Tools
 *
 * @returns ToolSet für streamText/generateText
 */
export function generateNavigationToolSet() {
  return {
    add_navigation_entry: addNavigationEntryTool,
  }
}

/**
 * Liste der Write-Operations in Navigation-Tools
 *
 * Diese Tools modifizieren Dateien und sollten einen Reload triggern.
 */
export const navigationWriteOperations: string[] = ["add_navigation_entry"]

/**
 * Prüft ob ein Tool-Name ein Navigation-Tool ist
 */
export function isNavigationTool(toolName: string): boolean {
  return toolName in navigationTools
}
