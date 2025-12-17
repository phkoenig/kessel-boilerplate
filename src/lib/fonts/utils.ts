/**
 * Font-Utilities für Theme-Verarbeitung
 * ======================================
 *
 * Hilfsfunktionen für das Mapping von rohen Font-Namen
 * zu CSS-Variablen und die Extraktion von Fonts aus CSS.
 */

import { FONT_NAME_TO_VARIABLE, isKnownFontVariable } from "./registry"

/**
 * Ergebnis eines Font-Mapping-Vorgangs.
 */
export interface FontMappingResult {
  /**
   * Die konvertierte CSS-Variable im Format "var(--font-xyz)"
   * oder null wenn kein Mapping gefunden wurde.
   */
  variable: string | null

  /**
   * Der ursprüngliche Eingabewert.
   */
  original: string

  /**
   * Ob das Mapping erfolgreich war.
   */
  success: boolean

  /**
   * Warnung bei fehlgeschlagenem Mapping.
   */
  warning?: string
}

/**
 * Konvertiert einen rohen Font-Namen zu einer CSS-Variable.
 *
 * Unterstützt verschiedene Eingabeformate:
 * - "Outfit, sans-serif" -> "var(--font-outfit)"
 * - "Inter" -> "var(--font-inter)"
 * - "var(--font-inter)" -> "var(--font-inter)" (unverändert)
 *
 * @param rawFontName - Der rohe Font-Name aus einem TweakCN-Export
 * @returns Das Mapping-Ergebnis mit Variable oder Warnung
 *
 * @example
 * mapRawFontToVariable("Outfit, sans-serif")
 * // { variable: "var(--font-outfit)", original: "Outfit, sans-serif", success: true }
 *
 * mapRawFontToVariable("Unknown Font")
 * // { variable: null, original: "Unknown Font", success: false, warning: "..." }
 */
export const mapRawFontToVariable = (rawFontName: string): FontMappingResult => {
  const original = rawFontName.trim()

  // Bereits eine CSS-Variable
  if (original.startsWith("var(")) {
    const innerVar = original.replace(/^var\((.+)\)$/, "$1")
    if (isKnownFontVariable(innerVar)) {
      return { variable: original, original, success: true }
    }
    return {
      variable: null,
      original,
      success: false,
      warning: `Unbekannte Font-Variable: ${innerVar}`,
    }
  }

  // Extrahiere den primären Font-Namen (vor dem Komma)
  const primaryFont = original.split(",")[0].trim()

  // Normalisiere für Lookup (lowercase, ohne Anführungszeichen)
  const normalizedFont = primaryFont.toLowerCase().replace(/["']/g, "")

  // Suche in der Registry
  const cssVariable = FONT_NAME_TO_VARIABLE[normalizedFont]

  if (cssVariable) {
    return {
      variable: `var(${cssVariable})`,
      original,
      success: true,
    }
  }

  // Versuche partielle Matches
  const partialMatch = Object.entries(FONT_NAME_TO_VARIABLE).find(([key]) =>
    normalizedFont.includes(key)
  )

  if (partialMatch) {
    return {
      variable: `var(${partialMatch[1]})`,
      original,
      success: true,
    }
  }

  return {
    variable: null,
    original,
    success: false,
    warning: `Font "${primaryFont}" nicht in der Registry registriert. Bitte in src/lib/fonts/registry.ts hinzufügen.`,
  }
}

/**
 * Extrahiert Font-Deklarationen aus CSS-Code.
 *
 * Sucht nach --font-sans, --font-mono und --font-serif Deklarationen.
 *
 * @param css - Der CSS-Code zum Parsen
 * @returns Ein Objekt mit den gefundenen Font-Deklarationen
 *
 * @example
 * extractFontsFromCSS(":root { --font-sans: Outfit, sans-serif; }")
 * // { "font-sans": "Outfit, sans-serif" }
 */
export const extractFontsFromCSS = (
  css: string
): Record<"font-sans" | "font-mono" | "font-serif", string | undefined> => {
  const result: Record<"font-sans" | "font-mono" | "font-serif", string | undefined> = {
    "font-sans": undefined,
    "font-mono": undefined,
    "font-serif": undefined,
  }

  const fontVarPattern = /--(font-(?:sans|mono|serif)):\s*([^;]+);/gi
  let match

  while ((match = fontVarPattern.exec(css)) !== null) {
    const [, varName, value] = match
    const key = varName as "font-sans" | "font-mono" | "font-serif"
    result[key] = value.trim()
  }

  return result
}

/**
 * Konvertiert alle Font-Deklarationen in CSS-Code zu var()-Syntax.
 *
 * @param css - Der CSS-Code zum Konvertieren
 * @returns Ein Objekt mit dem konvertierten CSS und eventuellen Warnungen
 *
 * @example
 * convertCSSFontsToVariables(":root { --font-sans: Outfit, sans-serif; }")
 * // { css: ":root { --font-sans: var(--font-outfit); }", warnings: [] }
 */
export const convertCSSFontsToVariables = (
  css: string
): {
  css: string
  warnings: string[]
  conversions: Array<{ from: string; to: string }>
} => {
  const warnings: string[] = []
  const conversions: Array<{ from: string; to: string }> = []
  let convertedCSS = css

  const fontVarPattern = /--(font-(?:sans|mono|serif)):\s*([^;]+);/gi
  let match

  while ((match = fontVarPattern.exec(css)) !== null) {
    const [fullMatch, varName, rawValue] = match
    const value = rawValue.trim()

    // Überspringe, wenn bereits var() Syntax
    if (value.startsWith("var(")) {
      continue
    }

    const mappingResult = mapRawFontToVariable(value)

    if (mappingResult.success && mappingResult.variable) {
      const replacement = `--${varName}: ${mappingResult.variable};`
      convertedCSS = convertedCSS.replace(fullMatch, replacement)
      conversions.push({ from: value, to: mappingResult.variable })
    } else if (mappingResult.warning) {
      warnings.push(mappingResult.warning)
    }
  }

  return { css: convertedCSS, warnings, conversions }
}

/**
 * Validiert, dass alle Font-Deklarationen in CSS die korrekte var() Syntax verwenden.
 *
 * @param css - Der CSS-Code zum Validieren
 * @returns Ein Array von Validierungsfehlern (leer wenn alles korrekt)
 */
export const validateCSSFontSyntax = (
  css: string
): Array<{ line: number; variable: string; value: string; message: string }> => {
  const errors: Array<{ line: number; variable: string; value: string; message: string }> = []
  const lines = css.split("\n")

  lines.forEach((line, index) => {
    const fontMatch = line.match(/--(font-(?:sans|mono|serif)):\s*([^;]+);/)
    if (fontMatch) {
      const [, varName, value] = fontMatch
      const trimmedValue = value.trim()

      // Prüfe, ob es die var() Syntax verwendet
      if (!trimmedValue.startsWith("var(")) {
        errors.push({
          line: index + 1,
          variable: `--${varName}`,
          value: trimmedValue,
          message: `Roher Font-Name gefunden. Erwartet: var(--font-*), gefunden: "${trimmedValue}"`,
        })
      } else {
        // Prüfe, ob die referenzierte Variable bekannt ist
        const innerVar = trimmedValue.replace(/^var\((.+)\)$/, "$1")
        if (!isKnownFontVariable(innerVar)) {
          errors.push({
            line: index + 1,
            variable: `--${varName}`,
            value: trimmedValue,
            message: `Unbekannte Font-Variable: ${innerVar}. Bitte in der Registry registrieren.`,
          })
        }
      }
    }
  })

  return errors
}
