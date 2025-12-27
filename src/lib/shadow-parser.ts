/**
 * Shadow-Komponenten für einen einzelnen Box-Shadow
 */
export interface ShadowComponents {
  offsetX: number // px
  offsetY: number // px
  blur: number // px
  spread: number // px
  color: string // rgb(...) oder rgba(...)
}

/**
 * Parst einen Box-Shadow String in Komponenten
 *
 * Format: "offsetX offsetY blur spread color"
 * Beispiel: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
 */
export function parseShadow(shadowStr: string): ShadowComponents | null {
  // Entferne führende/trailing Whitespace
  const trimmed = shadowStr.trim()
  if (!trimmed) return null

  // Extrahiere Farbe (letzter Teil nach rgb/rgba)
  const colorMatch = trimmed.match(/(rgb|rgba)\([^)]+\)$/)
  if (!colorMatch) return null

  const color = colorMatch[0]
  const withoutColor = trimmed.substring(0, colorMatch.index).trim()

  // Parse Zahlen (können px, em, rem haben oder ohne Einheit sein)
  const parts = withoutColor.split(/\s+/)
  if (parts.length < 2) return null

  const parseValue = (str: string): number => {
    const numMatch = str.match(/(-?\d+\.?\d*)/)
    return numMatch ? parseFloat(numMatch[1]) : 0
  }

  return {
    offsetX: parseValue(parts[0] || "0"),
    offsetY: parseValue(parts[1] || "0"),
    blur: parts[2] ? parseValue(parts[2]) : 0,
    spread: parts[3] ? parseValue(parts[3]) : 0,
    color,
  }
}

/**
 * Generiert einen Box-Shadow String aus Komponenten
 */
export function generateShadow(components: ShadowComponents): string {
  return `${components.offsetX}px ${components.offsetY}px ${components.blur}px ${components.spread}px ${components.color}`
}

/**
 * Parst einen CSS-Variablen-Wert der mehrere Box-Shadows enthalten kann
 *
 * Format: "shadow1, shadow2, ..."
 * Beispiel: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
 */
export function parseShadowValue(shadowValue: string): ShadowComponents[] {
  // Teile bei Kommas (aber nicht innerhalb von rgb())
  const shadows: ShadowComponents[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < shadowValue.length; i++) {
    const char = shadowValue[i]
    if (char === "(") depth++
    if (char === ")") depth--
    if (char === "," && depth === 0) {
      const parsed = parseShadow(current.trim())
      if (parsed) shadows.push(parsed)
      current = ""
    } else {
      current += char
    }
  }

  // Letzter Shadow
  if (current.trim()) {
    const parsed = parseShadow(current.trim())
    if (parsed) shadows.push(parsed)
  }

  return shadows.length > 0
    ? shadows
    : [{ offsetX: 0, offsetY: 0, blur: 0, spread: 0, color: "rgb(0 0 0 / 0.1)" }]
}

/**
 * Generiert einen Shadow-Wert aus mehreren Komponenten
 */
export function generateShadowValue(shadows: ShadowComponents[]): string {
  return shadows.map(generateShadow).join(", ")
}

/**
 * Konvertiert Hex-Farbe zu rgb() String
 */
export function hexToRgb(hex: string, opacity: number = 1): string {
  // Entferne #
  const cleanHex = hex.replace("#", "")
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  if (opacity === 1) {
    return `rgb(${r} ${g} ${b})`
  }
  return `rgb(${r} ${g} ${b} / ${opacity})`
}
