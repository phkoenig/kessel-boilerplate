"use client"

import { useState, useCallback, useEffect } from "react"
import { useTheme } from "@/lib/themes"
import { saveTheme } from "@/lib/themes/storage"

/**
 * Konvertiert einen String zu einer URL-freundlichen ID
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Entferne Sonderzeichen
    .replace(/[\s_-]+/g, "-") // Ersetze Leerzeichen/Underscores mit Bindestrichen
    .replace(/^-+|-+$/g, "") // Entferne führende/trailing Bindestriche
}

/**
 * Invertiert die Lightness eines OKLCH-Wertes für Dark Mode
 *
 * @param oklchValue - OKLCH-String im Format "oklch(L C H)"
 * @param offset - Optionaler Offset für die Lightness (Standard: 0)
 * @returns Invertierter OKLCH-String
 */
function invertLightness(oklchValue: string, offset: number = 0): string {
  // Parse: "oklch(0.55 0.15 145)" → { l: 0.55, c: 0.15, h: 145 }
  const match = oklchValue.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) return oklchValue

  const l = parseFloat(match[1])
  const c = parseFloat(match[2])
  const h = parseFloat(match[3])

  // Invertiere Lightness: L → 1-L + offset (clamped 0-1)
  const invertedL = Math.max(0, Math.min(1, 1 - l + offset))

  return `oklch(${invertedL.toFixed(2)} ${c} ${h})`
}

/**
 * Token-Wert für Light/Dark Mode
 */
export interface TokenValue {
  light: string
  dark: string
}

/**
 * Theme Editor State
 */
export interface ThemeEditorState {
  /** Welches Theme als Basis dient */
  baseThemeId: string | null
  /** Map von Token-Name zu Werten */
  pendingChanges: Map<string, TokenValue>
  /** Gibt es ungespeicherte Änderungen? */
  isDirty: boolean
}

/**
 * Theme Editor Actions
 */
export interface ThemeEditorActions {
  /**
   * Setzt Live-Preview für einen Token.
   *
   * - Im Light Mode: light angeben, dark wird automatisch berechnet (invertLightness)
   * - Im Dark Mode: dark angeben (light = undefined), light wird automatisch berechnet
   * - Beide angeben: Explizite Werte für beide Modi
   */
  previewToken: (name: string, light?: string, dark?: string) => void
  /** Setzt Vorschau zurück auf Basis-Theme */
  resetPreview: () => void
  /** Speichert Änderungen als neues Theme */
  saveAsNewTheme: (name: string, description?: string) => Promise<string>
  /** Liest aktuelle Token-Werte */
  getCurrentTokens: () => Record<string, TokenValue>
}

/**
 * Hook für Live-Theme-Editing
 *
 * Verwaltet temporäre Inline-Style-Änderungen und ermöglicht das Speichern als neues Theme.
 */
export function useThemeEditor(): ThemeEditorState & ThemeEditorActions {
  const { theme: currentThemeId } = useTheme()
  const [baseThemeId, setBaseThemeId] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Map<string, TokenValue>>(new Map())

  const previewToken = useCallback((name: string, light?: string, dark?: string) => {
    // Skip on server
    if (typeof window === "undefined") return

    const root = document.documentElement
    const isDark = root.classList.contains("dark")

    // Berechne fehlende Werte:
    // - Wenn light fehlt → aus dark berechnen (invertLightness)
    // - Wenn dark fehlt → aus light berechnen (invertLightness)
    let lightValue: string
    let darkValue: string

    if (light && dark) {
      // Beide explizit angegeben
      lightValue = light
      darkValue = dark
    } else if (light && !dark) {
      // Light Mode Editing: User editiert Light, Dark wird berechnet
      lightValue = light
      darkValue = invertLightness(light)
    } else if (!light && dark) {
      // Dark Mode Editing: User editiert Dark, Light wird berechnet
      darkValue = dark
      lightValue = invertLightness(dark)
    } else {
      // Beide undefined - nichts zu tun
      return
    }

    // Setze Inline-Style für aktuellen Modus
    root.style.setProperty(name, isDark ? darkValue : lightValue)

    // Speichere beide Werte im State
    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.set(name, { light: lightValue, dark: darkValue })
      return next
    })
  }, [])

  const resetPreview = useCallback(() => {
    // Skip on server
    if (typeof window === "undefined") return

    const root = document.documentElement

    // Entferne alle Inline-Styles die wir gesetzt haben
    pendingChanges.forEach((_, tokenName) => {
      root.style.removeProperty(tokenName)
    })

    setPendingChanges(new Map())
  }, [pendingChanges])

  // Initialisiere baseThemeId beim Mount
  useEffect(() => {
    if (currentThemeId && !baseThemeId) {
      setBaseThemeId(currentThemeId)
    }
  }, [currentThemeId, baseThemeId])

  // Aktualisiere baseThemeId wenn Theme gewechselt wird
  useEffect(() => {
    if (currentThemeId !== baseThemeId) {
      // Wenn Theme gewechselt wird, alle Änderungen zurücksetzen
      resetPreview()
      setBaseThemeId(currentThemeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetPreview ändert sich bei jeder pendingChanges-Änderung
  }, [currentThemeId, baseThemeId])

  const getCurrentTokens = useCallback((): Record<string, TokenValue> => {
    // Return empty on server
    if (typeof window === "undefined") return {}

    const root = document.documentElement
    const computedStyle = window.getComputedStyle(root)
    const isDark = root.classList.contains("dark")
    const tokens: Record<string, TokenValue> = {}

    // Liste aller CSS-Variablen die wir bearbeiten können
    const editableTokens = [
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--input",
      "--ring",
      "--radius",
      "--spacing",
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--sidebar",
      "--sidebar-foreground",
      "--sidebar-primary",
      "--sidebar-primary-foreground",
      "--sidebar-accent",
      "--sidebar-accent-foreground",
      "--sidebar-border",
      "--sidebar-ring",
      "--shadow-2xs",
      "--shadow-xs",
      "--shadow-sm",
      "--shadow-md",
      "--shadow-lg",
      "--shadow-xl",
      "--shadow-2xl",
    ]

    // Lade aktuelle Werte (aus Inline-Styles oder CSS)
    // Der computed value ist der aktuell angezeigte Wert für den aktuellen Modus
    editableTokens.forEach((tokenName) => {
      const value = computedStyle.getPropertyValue(tokenName).trim()
      // Speichere den Wert im korrekten Slot (light oder dark)
      // Der andere Modus bleibt leer - er wird bei Bedarf berechnet
      if (isDark) {
        tokens[tokenName] = { light: "", dark: value }
      } else {
        tokens[tokenName] = { light: value, dark: "" }
      }
    })

    return tokens
  }, [])

  const saveAsNewTheme = useCallback(
    async (name: string, description?: string): Promise<string> => {
      // This should only run on client
      if (typeof window === "undefined") {
        throw new Error("saveAsNewTheme kann nur auf dem Client aufgerufen werden")
      }

      if (!baseThemeId) {
        throw new Error("Kein Basis-Theme ausgewählt")
      }

      // Generiere Theme-ID aus Name
      const themeId = slugify(name)

      // Sammle alle geänderten Tokens
      const lightTokens: string[] = []
      const darkTokens: string[] = []

      // Geänderte Tokens haben Priorität
      pendingChanges.forEach((value, tokenName) => {
        lightTokens.push(`  ${tokenName}: ${value.light};`)
        darkTokens.push(`  ${tokenName}: ${value.dark};`)
      })

      // Generiere CSS
      const lightCSS = `[data-theme="${themeId}"] {\n${lightTokens.join("\n")}\n}`
      const darkCSS = `.dark[data-theme="${themeId}"] {\n${darkTokens.join("\n")}\n}`

      // Speichere Theme
      const result = await saveTheme({
        id: themeId,
        name,
        description: description ?? `Basiert auf ${baseThemeId}`,
        lightCSS,
        darkCSS,
      })

      if (!result.success) {
        throw new Error(result.error ?? "Fehler beim Speichern des Themes")
      }

      // Entferne Inline-Styles nach erfolgreichem Speichern
      resetPreview()

      return themeId
    },
    [baseThemeId, pendingChanges, getCurrentTokens, resetPreview]
  )

  const isDirty = pendingChanges.size > 0

  return {
    baseThemeId,
    pendingChanges,
    isDirty,
    previewToken,
    resetPreview,
    saveAsNewTheme,
    getCurrentTokens,
  }
}
