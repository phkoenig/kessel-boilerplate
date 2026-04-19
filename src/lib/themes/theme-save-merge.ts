/**
 * Reine Hilfsfunktionen fuer Theme-Speichern (Merge, CSS-Build, Verifikation).
 *
 * Kein React — geeignet fuer Unit-Tests und identische Logik wie im Theme-Editor.
 * Aus iryse portiert.
 */

import { parseThemeTokenBlocks } from "@/lib/themes/css"

/** Ein pending Token (Light- und Dark-Wert wie im Editor-State). */
export interface ThemePendingTokenValue {
  light: string
  dark: string
}

/**
 * Baut einen CSS-Block (Light oder Dark) aus einer Token-Map.
 */
export function buildThemeCss(
  themeId: string,
  tokens: Record<string, string>,
  isDark: boolean
): string {
  const selector = isDark ? `.dark[data-theme="${themeId}"]` : `:root[data-theme="${themeId}"]`
  const lines = Object.entries(tokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")

  return `${selector} {\n${lines}\n}`
}

/**
 * Wendet pending Token-Aenderungen auf Light/Dark-Maps an (trim, keine leeren Ueberschreibungen).
 */
export function mergePendingTokenChanges(
  light: Record<string, string>,
  dark: Record<string, string>,
  pendingChanges: Map<string, ThemePendingTokenValue>
): void {
  pendingChanges.forEach((value, tokenName) => {
    const lit = value.light?.trim() ?? ""
    const dk = value.dark?.trim() ?? ""
    if (lit.length > 0) {
      light[tokenName] = lit
    }
    if (dk.length > 0) {
      dark[tokenName] = dk
    }
  })
}

/**
 * Prueft nach Upload, ob pending Token-Werte im gespeicherten CSS vorkommen.
 *
 * Wirft einen Error, wenn Werte abweichen — der Editor kann dann die
 * Speicherung als fehlgeschlagen anzeigen, ohne die UI zu resetten.
 */
export function verifySavedThemeMatchesPending(
  themeId: string,
  cssText: string | null,
  pending: Map<string, ThemePendingTokenValue>
): void {
  if (pending.size === 0) {
    return
  }
  if (!cssText?.trim()) {
    throw new Error("Theme-Verifikation: Nach dem Speichern war das CSS leer.")
  }
  const blocks = parseThemeTokenBlocks(themeId, cssText)
  const failures: string[] = []
  pending.forEach((value, tokenName) => {
    const lit = value.light?.trim() ?? ""
    const dk = value.dark?.trim() ?? ""
    if (lit.length > 0 && blocks.light[tokenName] !== lit) {
      failures.push(
        `${tokenName} (light): erwartet ${lit}, im Storage: ${String(blocks.light[tokenName] ?? "<fehlt>")}`
      )
    }
    if (dk.length > 0 && blocks.dark[tokenName] !== dk) {
      failures.push(
        `${tokenName} (dark): erwartet ${dk}, im Storage: ${String(blocks.dark[tokenName] ?? "<fehlt>")}`
      )
    }
  })
  if (failures.length > 0) {
    throw new Error(
      `Theme-Verifikation fehlgeschlagen (${String(failures.length)} Abweichung/en):\n${failures.slice(0, 8).join("\n")}`
    )
  }
}

/**
 * Verhindert zerstoererisches Speichern, wenn CSS da ist aber kein Block geparst werden konnte.
 *
 * Beispiel-Szenario: Editor laedt fremdes CSS-Format, parser liefert leere Maps —
 * ohne diese Pruefung wuerde der Save-Vorgang die Datei mit leerem Block ueberschreiben.
 */
export function assertParsedThemeTokens(
  themeId: string,
  cssText: string | null,
  light: Record<string, string>,
  dark: Record<string, string>
): void {
  if (!cssText || cssText.trim().length < 24) {
    return
  }
  const mentionsTheme =
    cssText.includes(`data-theme="${themeId}"`) || cssText.includes(`data-theme='${themeId}'`)
  if (!mentionsTheme) {
    return
  }
  if (Object.keys(light).length === 0 && Object.keys(dark).length === 0) {
    throw new Error(
      "Theme-CSS enthaelt data-theme, aber es konnten keine Variablen gelesen werden. Bitte Seite neu laden und erneut speichern."
    )
  }
}
