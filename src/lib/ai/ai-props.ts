/**
 * Gemeinsame AI-Props für UI-Komponenten.
 *
 * Diese Props ermöglichen es, UI-Komponenten KI-steuerbar zu machen,
 * ohne sie explizit in AIInteractable zu wrappen.
 *
 * @example
 * ```tsx
 * // Statt:
 * <AIInteractable id="save-btn" action="trigger" description="..." keywords={[...]} category="actions">
 *   <Button onClick={save}>Speichern</Button>
 * </AIInteractable>
 *
 * // Jetzt:
 * <Button
 *   onClick={save}
 *   aiId="save-btn"
 *   aiDescription="Speichert die Änderungen"
 *   aiKeywords={["speichern", "save"]}
 * >
 *   Speichern
 * </Button>
 * ```
 */

import type { AIActionType, AIComponentCategory } from "@/lib/ai/ai-manifest.schema"

/**
 * AI-Props für UI-Komponenten.
 * Alle Props sind optional - wenn `aiId` nicht gesetzt ist, verhält sich
 * die Komponente wie gewohnt ohne AI-Fähigkeit.
 */
export interface AIProps {
  /**
   * Eindeutige ID für die KI-Registrierung.
   * Muss im ai-manifest.json registriert sein.
   * Wenn nicht gesetzt, ist die Komponente nicht KI-steuerbar.
   */
  aiId?: string

  /**
   * Menschenlesbare Beschreibung für die KI.
   * Beschreibt, was die Aktion tut.
   * @example "Speichert die aktuellen Änderungen"
   */
  aiDescription?: string

  /**
   * Suchbegriffe für KI-Erkennung.
   * Sollte mehrsprachig sein (DE/EN).
   * @example ["speichern", "save", "sichern"]
   */
  aiKeywords?: string[]

  /**
   * Aktionstyp - wird automatisch basierend auf Komponententyp gesetzt:
   * - Button: "trigger" (default) oder "navigate" (wenn href)
   * - Switch: "toggle"
   * - Select: "select"
   * - Input: "input"
   *
   * Kann überschrieben werden wenn nötig.
   */
  aiAction?: AIActionType

  /**
   * Kategorie der Komponente.
   * @default "actions" für Button, "settings" für Switch, "form" für Input/Select
   */
  aiCategory?: AIComponentCategory

  /**
   * Ziel der Aktion (Route, Panel-Name, etc.).
   * Bei Navigation-Buttons: Die Ziel-URL.
   */
  aiTarget?: string
}

/**
 * Default-Werte für AI-Props basierend auf Komponententyp.
 */
export const AI_DEFAULTS = {
  button: {
    action: "trigger" as AIActionType,
    category: "actions" as AIComponentCategory,
  },
  switch: {
    action: "toggle" as AIActionType,
    category: "settings" as AIComponentCategory,
  },
  select: {
    action: "select" as AIActionType,
    category: "form" as AIComponentCategory,
  },
  input: {
    action: "input" as AIActionType,
    category: "form" as AIComponentCategory,
  },
} as const

/**
 * Extrahiert AI-Props aus den gesamten Props und gibt den Rest zurück.
 * Nützlich für Spread-Operationen.
 */
export function extractAIProps<T extends AIProps>(
  props: T
): { aiProps: AIProps; rest: Omit<T, keyof AIProps> } {
  const { aiId, aiDescription, aiKeywords, aiAction, aiCategory, aiTarget, ...rest } = props
  return {
    aiProps: { aiId, aiDescription, aiKeywords, aiAction, aiCategory, aiTarget },
    rest: rest as Omit<T, keyof AIProps>,
  }
}

/**
 * Prüft ob AI-Props gesetzt sind (aiId ist Pflicht für AI-Fähigkeit).
 */
export function hasAIProps(props: AIProps): boolean {
  return !!props.aiId
}
