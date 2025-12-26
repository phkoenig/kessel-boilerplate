/**
 * AI Theme Tools
 *
 * Tools für den AI-Chatbot zum Live-Editing von Design-Tokens.
 * Änderungen werden als temporäre Inline-Styles angezeigt und können als neues Theme gespeichert werden.
 */

import { tool, type ToolSet } from "ai"
import { z } from "zod"
import type { ToolExecutionContext } from "./tool-executor"

/**
 * Generiert Theme-Tools für AI-Chatbot
 *
 * @param ctx - Execution Context (userId, sessionId, dryRun)
 */
export function generateThemeTools(ctx: ToolExecutionContext): ToolSet {
  return {
    get_theme_tokens: tool({
      description: `Liest die aktuellen Token-Werte des aktivierten Themes.
Gibt alle Design-Tokens (Farben, Radii, etc.) zurück, die bearbeitet werden können.`,
      inputSchema: z.object({
        theme_id: z
          .string()
          .optional()
          .describe("Theme-ID (optional, verwendet aktuelles Theme wenn nicht angegeben)"),
      }),
      execute: async ({ theme_id }) => {
        // Client-seitige Funktion - wird vom Browser ausgeführt
        return {
          __theme_action: "get_tokens",
          theme_id: theme_id ?? "current",
          message: "Token-Werte werden vom Client geladen",
        }
      },
    }),

    preview_theme_tokens: tool({
      description: `Zeigt eine LIVE-VORSCHAU von Theme-Token-Änderungen.
Die Änderungen werden NICHT gespeichert, nur angezeigt.
Der User kann die Änderungen dann bestätigen oder ablehnen.

OKLCH Format: oklch(lightness chroma hue)
- lightness: 0-1 (0=schwarz, 1=weiß)
- chroma: 0-0.4 (Sättigung)
- hue: 0-360 (Farbton, z.B. 0=rot, 120=grün, 240=blau)`,
      inputSchema: z.object({
        tokens: z
          .array(
            z.object({
              name: z.string().describe("Token-Name, z.B. '--primary'"),
              light_value: z.string().optional().describe("Light-Mode Wert (OKLCH Format)"),
              dark_value: z.string().optional().describe("Dark-Mode Wert (OKLCH Format)"),
            })
          )
          .describe("Liste der zu ändernden Tokens"),
        description: z.string().describe("Kurze Beschreibung der Änderung"),
      }),
      execute: async ({ tokens, description }) => {
        return {
          __theme_action: "preview",
          tokens,
          description,
          message: `Vorschau: ${description}. Gefällt dir das? Sag "speichern" oder "zurücksetzen".`,
        }
      },
    }),

    reset_theme_preview: tool({
      description: `Setzt alle Vorschau-Änderungen zurück auf die gespeicherten Werte des Basis-Themes.`,
      inputSchema: z.object({}),
      execute: async () => {
        return {
          __theme_action: "reset",
          message: "Vorschau zurückgesetzt auf gespeicherte Werte.",
        }
      },
    }),

    save_as_new_theme: tool({
      description: `Speichert die aktuellen Token-Änderungen als NEUES Theme.
Das bestehende Theme wird NICHT überschrieben - es wird ein neues Theme erstellt.
Nach dem Speichern wird das neue Theme automatisch aktiviert.`,
      inputSchema: z.object({
        name: z.string().describe("Name für das neue Theme (z.B. 'Sunset', 'Ocean Warm')"),
        description: z.string().optional().describe("Optionale Beschreibung des Themes"),
      }),
      execute: async ({ name, description }) => {
        return {
          __theme_action: "save_as_new",
          name,
          description,
          message: `Speichere Theme "${name}"...`,
        }
      },
    }),
  }
}
