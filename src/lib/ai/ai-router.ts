/**
 * AI-gestützter Model-Router
 *
 * Verwendet Gemini Flash zur intelligenten Klassifikation von User-Anfragen.
 * Analysiert den Chatverlauf und entscheidet kontextbewusst, welche Kategorie zutrifft:
 * - UI_ACTION: Navigation, Panel-Toggles, UI-Interaktionen
 * - DB_QUERY: Datenbank-Operationen (CRUD)
 * - VISION: Screenshot-Analyse, visuelle Fragen
 * - CHAT: Allgemeine Fragen, Erklärungen, Smalltalk
 *
 * Vorteile gegenüber Keyword-Router:
 * - Versteht Kontext ("ja bitte" nach Navigation-Angebot)
 * - Erkennt implizite Intentionen
 * - Flexibel für neue Use-Cases ohne Code-Änderungen
 */

import { generateText } from "ai"
import { openrouter } from "./openrouter-provider"
import { DEFAULT_CHAT_MODEL } from "./openrouter-provider"
import type { ModelMessage } from "ai"

/**
 * Routing-Kategorien
 */
export type RouteCategory = "UI_ACTION" | "DB_QUERY" | "VISION" | "CHAT"

/**
 * Extrahiert Text aus einer CoreMessage
 */
function extractTextFromMessage(message: ModelMessage): string {
  if (typeof message.content === "string") {
    return message.content
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ")
  }

  return ""
}

/**
 * Formatiert Chatverlauf für den Router-Prompt
 */
function formatConversationContext(messages: ModelMessage[]): string {
  return messages
    .map((m) => {
      const text = extractTextFromMessage(m)
      return `${m.role.toUpperCase()}: ${text}`
    })
    .join("\n")
}

/**
 * Router-System-Prompt
 */
const ROUTER_SYSTEM_PROMPT = `Du bist ein Routing-Klassifikator für einen KI-Assistenten.

DEINE AUFGABE:
Analysiere den Chatverlauf und die letzte Nachricht. Entscheide, welche Kategorie zutrifft.

KATEGORIEN:
- UI_ACTION: Navigation, Seite öffnen, Panel ein/ausklappen, Menü bedienen, Bestätigung einer Navigation ("ja", "ok", "mach das", "bitte")
- DB_QUERY: Daten lesen/erstellen/ändern/löschen, Benutzer/Rollen verwalten, Datenbank-Operationen
- VISION: Fragen zu dem, was auf dem Bildschirm zu sehen ist, Screenshot-Analyse, visuelle Beschreibungen
- CHAT: Allgemeine Fragen, Erklärungen, Hilfe, Smalltalk, Danksagungen

WICHTIG:
- Beachte den KONTEXT! Wenn vorher eine Navigation angeboten wurde und der User "ja" sagt → UI_ACTION
- Kurze Bestätigungen wie "ja", "ok", "bitte", "mach das" sind oft Bestätigungen der vorherigen Aktion
- "Kannst du das?" nach einem Angebot → gleiche Kategorie wie das Angebot
- Antworte NUR mit einem Wort: UI_ACTION, DB_QUERY, VISION oder CHAT`

/**
 * KI-gestützter Model-Router
 *
 * Verwendet Gemini Flash zur Klassifikation (kein Tool-Calling nötig!)
 * Analysiert die letzten 6 Nachrichten (3 Turns) für Kontext.
 *
 * @param messages - Chatverlauf
 * @returns RouteCategory
 */
export async function routeWithAI(messages: ModelMessage[]): Promise<RouteCategory> {
  // Nur letzte 6 Nachrichten für Kontext (3 Turns)
  const recentMessages = messages.slice(-6)

  if (recentMessages.length === 0) {
    return "CHAT"
  }

  const conversationContext = formatConversationContext(recentMessages)

  try {
    const { text } = await generateText({
      model: openrouter(DEFAULT_CHAT_MODEL),
      system: ROUTER_SYSTEM_PROMPT,
      prompt: `CHATVERLAUF:\n${conversationContext}\n\nKATEGORIE:`,
      temperature: 0, // Deterministisch
    })

    // Parse Antwort: Entferne alles außer Großbuchstaben und Unterstrichen
    const category = text
      .trim()
      .toUpperCase()
      .replace(/[^A-Z_]/g, "") as RouteCategory

    // Validierung: Fallback auf CHAT wenn ungültige Antwort
    if (!["UI_ACTION", "DB_QUERY", "VISION", "CHAT"].includes(category)) {
      console.warn(`[AI-Router] Invalid category "${text}", falling back to CHAT`)
      return "CHAT"
    }

    return category
  } catch (error) {
    console.error("[AI-Router] Error during routing:", error)
    // Fallback auf CHAT bei Fehler
    return "CHAT"
  }
}
