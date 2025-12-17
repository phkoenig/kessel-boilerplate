/**
 * Font-Registry für automatisches Mapping
 * ========================================
 *
 * Zentrale Quelle für alle bekannten Fonts mit automatischer
 * Konvertierung von rohen Font-Namen zu CSS-Variablen.
 *
 * Diese Registry wird verwendet, um TweakCN-Exporte zu validieren
 * und automatisch in das CSS-First Format zu konvertieren.
 *
 * WICHTIG: Diese Registry enthält nur Fonts, die im Default-Theme
 * verwendet werden. Alle anderen Fonts werden dynamisch über die
 * Google Fonts API geladen.
 */

/**
 * Mapping von Display-Namen und alternativen Schreibweisen
 * zu den entsprechenden CSS-Variablen.
 *
 * Schlüssel: Verschiedene Schreibweisen des Font-Namens (lowercase)
 * Wert: Die CSS-Variable ohne "var()" Wrapper
 *
 * @example
 * "inter" -> "--font-inter"
 */
export const FONT_NAME_TO_VARIABLE: Record<string, string> = {
  // Default Theme - Nur Inter wird statisch geladen
  inter: "--font-inter",
}

/**
 * Alle bekannten CSS-Variablen für Fonts.
 * Wird für Validierungen verwendet.
 */
export const KNOWN_FONT_VARIABLES: readonly string[] = ["--font-inter"] as const

/**
 * Font-Kategorien für die Zuordnung zu --font-sans, --font-mono, --font-serif.
 */
export const FONT_CATEGORIES: Record<string, "sans" | "mono" | "serif"> = {
  "--font-inter": "sans",
}

/**
 * Prüft, ob eine CSS-Variable eine bekannte Font-Variable ist.
 *
 * @param variable - Die CSS-Variable (z.B. "--font-inter" oder "var(--font-inter)")
 * @returns true wenn die Variable bekannt ist
 */
export const isKnownFontVariable = (variable: string): boolean => {
  // Entferne var() Wrapper falls vorhanden
  const cleanVar = variable.replace(/^var\((.+)\)$/, "$1")
  return KNOWN_FONT_VARIABLES.includes(cleanVar as (typeof KNOWN_FONT_VARIABLES)[number])
}

/**
 * Gibt die Kategorie einer Font-Variable zurück.
 *
 * @param variable - Die CSS-Variable (z.B. "--font-inter")
 * @returns Die Kategorie ("sans", "mono", "serif") oder undefined
 */
export const getFontCategory = (variable: string): "sans" | "mono" | "serif" | undefined => {
  const cleanVar = variable.replace(/^var\((.+)\)$/, "$1")
  return FONT_CATEGORIES[cleanVar]
}
