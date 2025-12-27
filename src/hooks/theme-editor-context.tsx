"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
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
 */
function invertLightness(oklchValue: string, offset: number = 0): string {
  const match = oklchValue.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) return oklchValue

  const l = parseFloat(match[1])
  const c = parseFloat(match[2])
  const h = parseFloat(match[3])

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
 * Ausgewähltes Element für Detail-Panel
 */
export interface SelectedElement {
  type: "color" | "colorPair" | "font" | "radius" | "shadow"
  tokenName: string
  subType?: "background" | "foreground"
  originalValue: string
  originalDarkValue?: string
  foregroundTokenName?: string
}

/**
 * Theme Editor Context Value
 */
interface ThemeEditorContextValue {
  baseThemeId: string | null
  pendingChanges: Map<string, TokenValue>
  isDirty: boolean
  selectedElement: SelectedElement | null
  previewToken: (name: string, light?: string, dark?: string) => void
  resetPreview: () => void
  saveAsNewTheme: (name: string, description?: string) => Promise<string>
  getCurrentTokens: () => Record<string, TokenValue>
  setSelectedElement: (element: SelectedElement | null) => void
}

const ThemeEditorContext = createContext<ThemeEditorContextValue | null>(null)

/**
 * ThemeEditorProvider - Teilt Theme-Editor-State zwischen Komponenten
 */
export function ThemeEditorProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { theme: currentThemeId } = useTheme()
  const [baseThemeId, setBaseThemeId] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Map<string, TokenValue>>(new Map())
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  const previewToken = useCallback((name: string, light?: string, dark?: string) => {
    if (typeof window === "undefined") return

    const root = document.documentElement
    const isDark = root.classList.contains("dark")

    let lightValue: string
    let darkValue: string

    if (light && dark) {
      lightValue = light
      darkValue = dark
    } else if (light && !dark) {
      lightValue = light
      darkValue = invertLightness(light)
    } else if (!light && dark) {
      darkValue = dark
      lightValue = invertLightness(dark)
    } else {
      return
    }

    root.style.setProperty(name, isDark ? darkValue : lightValue)

    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.set(name, { light: lightValue, dark: darkValue })
      return next
    })
  }, [])

  const resetPreview = useCallback(() => {
    if (typeof window === "undefined") return

    const root = document.documentElement

    pendingChanges.forEach((_, tokenName) => {
      root.style.removeProperty(tokenName)
    })

    setPendingChanges(new Map())
  }, [pendingChanges])

  useEffect(() => {
    if (currentThemeId && !baseThemeId) {
      setBaseThemeId(currentThemeId)
    }
  }, [currentThemeId, baseThemeId])

  useEffect(() => {
    if (currentThemeId !== baseThemeId) {
      resetPreview()
      setBaseThemeId(currentThemeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentThemeId, baseThemeId])

  const getCurrentTokens = useCallback((): Record<string, TokenValue> => {
    if (typeof window === "undefined") return {}

    const root = document.documentElement
    const computedStyle = window.getComputedStyle(root)
    const isDark = root.classList.contains("dark")
    const tokens: Record<string, TokenValue> = {}

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

    editableTokens.forEach((tokenName) => {
      const value = computedStyle.getPropertyValue(tokenName).trim()
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
      if (typeof window === "undefined") {
        throw new Error("saveAsNewTheme kann nur auf dem Client aufgerufen werden")
      }

      if (!baseThemeId) {
        throw new Error("Kein Basis-Theme ausgewählt")
      }

      const themeId = slugify(name)

      const lightTokens: string[] = []
      const darkTokens: string[] = []

      pendingChanges.forEach((value, tokenName) => {
        lightTokens.push(`  ${tokenName}: ${value.light};`)
        darkTokens.push(`  ${tokenName}: ${value.dark};`)
      })

      const lightCSS = `[data-theme="${themeId}"] {\n${lightTokens.join("\n")}\n}`
      const darkCSS = `.dark[data-theme="${themeId}"] {\n${darkTokens.join("\n")}\n}`

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

      resetPreview()

      return themeId
    },
    [baseThemeId, pendingChanges, resetPreview]
  )

  const isDirty = pendingChanges.size > 0

  return (
    <ThemeEditorContext.Provider
      value={{
        baseThemeId,
        pendingChanges,
        isDirty,
        selectedElement,
        previewToken,
        resetPreview,
        saveAsNewTheme,
        getCurrentTokens,
        setSelectedElement,
      }}
    >
      {children}
    </ThemeEditorContext.Provider>
  )
}

/**
 * Hook für Theme-Editor
 */
export function useThemeEditor(): ThemeEditorContextValue {
  const context = useContext(ThemeEditorContext)
  if (!context) {
    throw new Error("useThemeEditor must be used within ThemeEditorProvider")
  }
  return context
}
