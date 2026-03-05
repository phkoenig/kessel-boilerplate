/**
 * Tool-Metadata Types
 *
 * Definiert Metadata-Interfaces für Tools, die Auswirkungen auf
 * die Navigation oder andere Systemkomponenten haben können.
 *
 * @module lib/ai/types/tool-metadata
 */

import type { LucideIcon } from "lucide-react"

/**
 * Vorschlag für einen neuen Navigation-Eintrag
 *
 * Wird von Tools zurückgegeben, die `affectsNavigation: true` haben,
 * um dem System mitzuteilen, welcher Navigation-Eintrag erstellt werden soll.
 */
export interface NavigationSuggestion {
  /** Pfad des Parent-Navigation-Items (z.B. "/module-1") */
  parentPath: string

  /** Vorgeschlagenes Label für das neue NavItem (z.B. "Neue Seite") */
  suggestedLabel: string

  /** Vorgeschlagene ID für das neue NavItem (z.B. "module-1-neue-seite") */
  suggestedId: string

  /** Lucide Icon Name als String (z.B. "BookMarked", "FileText") */
  icon?: string

  /** Optionale Beschreibung für die neue Seite */
  description?: string
}

/**
 * Ergebnis eines Tools mit Navigation-Auswirkungen
 *
 * Erweitert das Standard-Tool-Result um Navigation-Informationen.
 */
export interface NavigationAwareToolResult<T = unknown> {
  /** Standard-Erfolgs-Flag */
  success: boolean

  /** Optionale Fehlermeldung */
  error?: string

  /** Tool-spezifische Daten */
  data?: T

  /** Optionale Nachricht für den User */
  message?: string

  /** Navigation-Suggestion falls das Tool Navigation-Auswirkungen hat */
  navigationSuggestion?: NavigationSuggestion
}

/**
 * Funktion die eine NavigationSuggestion aus Tool-Args und Result generiert
 */
export type NavigationSuggestionFn<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  result: TResult
) => NavigationSuggestion | null

/**
 * Tool-Metadata Interface
 *
 * Erweitert die Standard-Tool-Definition um Metadata für System-Aktionen.
 */
export interface ToolMetadata<TArgs = unknown, TResult = unknown> {
  /**
   * Gibt an, ob dieses Tool Auswirkungen auf die Navigation haben kann.
   * Wenn true, wird nach der Tool-Ausführung eine Follow-up-Frage gestellt.
   */
  affectsNavigation?: boolean

  /**
   * Funktion die eine NavigationSuggestion generiert.
   * Wird nur aufgerufen wenn `affectsNavigation: true` und das Tool erfolgreich war.
   */
  navigationSuggestion?: NavigationSuggestionFn<TArgs, TResult>

  /**
   * Optionale Kategorie für Gruppierung in der Tool-Übersicht
   */
  category?: string

  /**
   * Ob dieses Tool schreibende Operationen durchführt (Insert/Update/Delete)
   */
  isWriteOperation?: boolean

  /**
   * Ob dieses Tool einen Page-Reload nach Ausführung benötigt
   */
  requiresReload?: boolean
}

/**
 * Erweiterte Tool-Definition mit Metadata
 *
 * Kann verwendet werden um Tools mit zusätzlichen Metadaten zu versehen.
 */
export interface ToolWithMetadata<TArgs = unknown, TResult = unknown> {
  /** Tool-Beschreibung für das LLM */
  description: string

  /** Zod-Schema für die Eingabe-Parameter */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: any

  /** Ausführungsfunktion */
  execute: (args: TArgs) => Promise<TResult>

  /** Optionale Metadata */
  metadata?: ToolMetadata<TArgs, TResult>
}

/**
 * Mapping von Icon-Namen zu Lucide-Icons
 *
 * Wird verwendet um String-Icon-Namen in Komponenten aufzulösen.
 */
export type IconMapping = Record<string, LucideIcon>

/**
 * Marker für Tool-Results die Navigation-Auswirkungen haben
 *
 * Wird im Tool-Result-Stream verwendet um dem Client zu signalisieren,
 * dass eine Navigation-Suggestion verfügbar ist.
 */
export const NAVIGATION_SUGGESTION_MARKER = "__navigation_suggestion" as const

/**
 * Type Guard: Prüft ob ein Tool-Result eine NavigationSuggestion enthält
 */
export function hasNavigationSuggestion(result: unknown): result is NavigationAwareToolResult {
  return (
    typeof result === "object" &&
    result !== null &&
    "navigationSuggestion" in result &&
    typeof (result as NavigationAwareToolResult).navigationSuggestion === "object"
  )
}

/**
 * Extrahiert die NavigationSuggestion aus einem Tool-Result
 */
export function extractNavigationSuggestion(result: unknown): NavigationSuggestion | null {
  if (hasNavigationSuggestion(result)) {
    return result.navigationSuggestion ?? null
  }
  return null
}
