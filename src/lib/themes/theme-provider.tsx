"use client"

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

import { loadGoogleFonts } from "@/lib/fonts"

/**
 * LocalStorage Key für das gespeicherte Theme.
 */
const THEME_STORAGE_KEY = "tweakcn-theme"

/**
 * LocalStorage Key für Corner-Style.
 */
const CORNER_STYLE_STORAGE_KEY = "corner-style"

/**
 * Default Theme ID (Fallback).
 * Kann über NEXT_PUBLIC_DEFAULT_THEME Environment-Variable überschrieben werden.
 */
const DEFAULT_THEME_ID = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

/**
 * Corner-Style Typ.
 * - rounded: Standard border-radius
 * - squircle: iOS-style Superellipse (wenn Browser unterstützt, sonst Fallback auf rounded)
 */
export type CornerStyle = "rounded" | "squircle"

/**
 * Theme-Metadaten Interface.
 */
export interface ThemeMeta {
  id: string
  name: string
  description: string
  dynamicFonts?: string[]
}

/**
 * Theme Context Value Type.
 * Vereinfachte API für CSS-First Architektur.
 */
export interface ThemeContextValue {
  /** Aktuelle Theme-ID */
  theme: string
  /** Theme wechseln. skipValidation=true überspringt die Existenzprüfung (z.B. direkt nach Import) */
  setTheme: (id: string, options?: { skipValidation?: boolean }) => void
  /** Alle verfügbaren Themes (builtin + dynamisch) */
  themes: ThemeMeta[]
  /** Aktueller Color-Mode (light/dark/system) */
  colorMode: string
  /** Color-Mode wechseln */
  setColorMode: (mode: "light" | "dark" | "system") => void
  /** Themes neu laden (nach Import/Delete). Gibt die aktualisierte Liste zurück. */
  refreshThemes: () => Promise<ThemeMeta[]>
  /** Lädt gerade Themes */
  isLoading: boolean
  /** Aktueller Corner-Style (rounded | squircle) */
  cornerStyle: CornerStyle
  /** Corner-Style wechseln */
  setCornerStyle: (style: CornerStyle) => void
  /** Prüft ob Browser Squircle unterstützt */
  supportsSquircle: boolean
  /** Theme-CSS neu laden (z.B. nach Speichern). Gibt true bei Erfolg zurück. */
  refreshThemeCSS: () => Promise<boolean>
}

/**
 * Theme Context.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Hook zum Zugriff auf den Theme-Context.
 *
 * @throws Error wenn außerhalb des ThemeProviders verwendet
 * @returns ThemeContextValue
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface CustomThemeProviderProps {
  children: ReactNode
  /** Standard-Theme-ID, falls nichts gespeichert ist */
  defaultTheme?: string
}

/**
 * Lädt dynamische Theme-CSS-Datei aus Supabase Storage.
 * Prüft zuerst, ob das CSS bereits serverseitig oder client-seitig geladen wurde.
 *
 * Multi-Tenant: Themes liegen im tenant-spezifischen Ordner.
 *
 * WICHTIG: Verwendet IMMER einen Cache-Buster (Session-basiert), um sicherzustellen,
 * dass Änderungen sofort sichtbar sind. Der Session-Buster wird einmal pro
 * Page-Load generiert und bleibt während der Session konstant.
 *
 * @param themeId - Die Theme-ID
 * @param forceReload - Wenn true, wird das CSS mit neuem Timestamp neu geladen
 * @returns true wenn CSS erfolgreich geladen wurde, false bei Fehler
 */
async function loadDynamicThemeCSS(themeId: string, forceReload = false): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return false

  // Prüfe, ob das CSS bereits serverseitig geladen wurde (als <style> Tag)
  const existingStyle = document.getElementById("default-theme-css")
  if (themeId === DEFAULT_THEME_ID && existingStyle && !forceReload) {
    return true
  }

  // Multi-Tenant: Tenant-basierter Storage-Pfad
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || null
  const storagePath =
    tenantSlug && tenantSlug !== "public" ? `${tenantSlug}/${themeId}.css` : `${themeId}.css`

  // Cache-Buster: IMMER verwenden um Browser-Cache zu umgehen
  // Bei forceReload: neuer Timestamp, sonst Session-basierter Timestamp
  const cacheBuster = `?t=${forceReload ? Date.now() : getSessionCacheBuster()}`

  // Prüfe, ob das CSS bereits als <link> geladen wurde
  const existingLink = document.querySelector(`link[data-theme-id="${themeId}"]`) as HTMLLinkElement

  if (existingLink) {
    if (forceReload) {
      // Update href mit neuem Cache-Buster um CSS neu zu laden
      existingLink.href = `${supabaseUrl}/storage/v1/object/public/themes/${storagePath}${cacheBuster}`
    }
    return true
  }

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `${supabaseUrl}/storage/v1/object/public/themes/${storagePath}${cacheBuster}`
  link.setAttribute("data-theme-id", themeId)

  // Prüfe ob CSS erfolgreich geladen wurde
  return new Promise((resolve) => {
    link.onload = () => resolve(true)
    link.onerror = () => {
      console.warn(`[ThemeProvider] Failed to load CSS for theme: ${themeId}`)
      resolve(false)
    }
    document.head.appendChild(link)
  })
}

/**
 * Session-basierter Cache-Buster.
 * Wird einmal pro Page-Load generiert und bleibt während der Session konstant.
 * Das verhindert übermäßige Requests bei Navigation innerhalb der App,
 * stellt aber sicher, dass nach einem Hard-Reload die aktuelle Version geladen wird.
 */
let sessionCacheBuster: number | null = null
function getSessionCacheBuster(): number {
  if (sessionCacheBuster === null) {
    sessionCacheBuster = Date.now()
  }
  return sessionCacheBuster
}

/**
 * Custom Theme Provider Komponente.
 *
 * CSS-First Architektur:
 * - Setzt nur das data-theme Attribut auf document.documentElement
 * - Lädt alle Themes aus Supabase Storage (keine lokalen Themes mehr)
 */
const CustomThemeProvider = ({
  children,
  defaultTheme = DEFAULT_THEME_ID,
}: CustomThemeProviderProps): React.ReactElement => {
  // next-themes Hook für Dark/Light Mode
  const { theme: colorModeValue, setTheme: setNextTheme } = useNextTheme()

  const [theme, setThemeState] = useState<string>(defaultTheme)
  const [themes, setThemes] = useState<ThemeMeta[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cornerStyle, setCornerStyleState] = useState<CornerStyle>("rounded")
  const [supportsSquircle, setSupportsSquircle] = useState(false)

  /**
   * Lädt Themes aus der Supabase API.
   * Gibt die aktualisierte Theme-Liste zurück (für await-basierte Nutzung).
   */
  const refreshThemes = useCallback(async (): Promise<ThemeMeta[]> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/themes/list")

      // Prüfe Content-Type bevor JSON geparst wird
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("API-Route /api/themes/list liefert kein JSON:", contentType)
        // Fallback: Leeres Array setzen
        setThemes([])
        return []
      }

      if (response.ok) {
        const data = await response.json()
        if (data.themes && Array.isArray(data.themes)) {
          // Transformiere API-Response zu ThemeMeta-Format
          const apiThemes: ThemeMeta[] = data.themes.map(
            (t: { id: string; name: string; description: string; dynamicFonts?: string[] }) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              dynamicFonts: t.dynamicFonts,
            })
          )
          setThemes(apiThemes)
          return apiThemes
        } else {
          // Fallback: Leeres Array wenn keine Themes vorhanden
          setThemes([])
          return []
        }
      } else {
        console.warn(`API-Route /api/themes/list fehlgeschlagen: ${response.status}`)
        // Fallback: Leeres Array setzen
        setThemes([])
        return []
      }
    } catch (error) {
      console.error("Fehler beim Laden der Themes:", error)
      // Fallback: Leeres Array setzen statt zu crashen
      setThemes([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialisierung beim Mount
  useEffect(() => {
    setMounted(true)

    // Gespeichertes Theme laden (mit Fallback auf Default)
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme
    setThemeState(savedThemeId)

    // Gespeicherten Corner-Style laden
    const savedCornerStyle = localStorage.getItem(CORNER_STYLE_STORAGE_KEY) as CornerStyle | null
    if (savedCornerStyle && (savedCornerStyle === "rounded" || savedCornerStyle === "squircle")) {
      setCornerStyleState(savedCornerStyle)
    }

    // Prüfe Browser-Support für Squircle (CSS corner-shape)
    if (typeof CSS !== "undefined" && CSS.supports) {
      setSupportsSquircle(CSS.supports("corner-shape", "squircle"))
    }

    // Themes aus API laden
    refreshThemes()
  }, [refreshThemes])

  // KERNLOGIK: Theme-Attribut setzen + Fonts/CSS laden
  useEffect(() => {
    if (!mounted) return

    // Setze data-theme Attribut
    document.documentElement.setAttribute("data-theme", theme)

    // Finde Theme-Metadaten
    const themeMeta = themes.find((t) => t.id === theme)

    if (themeMeta) {
      // Lade dynamische Fonts, falls das Theme welche benötigt
      if (themeMeta.dynamicFonts && themeMeta.dynamicFonts.length > 0) {
        loadGoogleFonts(themeMeta.dynamicFonts).catch((err) => {
          console.error("Fehler beim Laden dynamischer Fonts:", err)
        })
      }
    }

    // Lade Theme-CSS aus Supabase Storage (für alle Themes)
    loadDynamicThemeCSS(theme)
      .then((success) => {
        // Wenn CSS nicht geladen werden konnte und es nicht das Default-Theme ist,
        // fallback auf Default-Theme
        if (!success && theme !== DEFAULT_THEME_ID) {
          console.warn(
            `[ThemeProvider] Theme CSS nicht geladen, fallback auf Default-Theme: ${DEFAULT_THEME_ID}`
          )
          setThemeState(DEFAULT_THEME_ID)
          localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Theme-CSS:", err)
        // Fallback auf Default-Theme bei Fehler
        if (theme !== DEFAULT_THEME_ID) {
          console.warn(
            `[ThemeProvider] CSS-Load-Fehler, fallback auf Default-Theme: ${DEFAULT_THEME_ID}`
          )
          setThemeState(DEFAULT_THEME_ID)
          localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
        }
      })
  }, [theme, themes, mounted])

  // Corner-Style Attribut setzen
  useEffect(() => {
    if (!mounted) return

    // Setze data-corner-style Attribut (für CSS @supports Regel)
    document.documentElement.setAttribute("data-corner-style", cornerStyle)
  }, [cornerStyle, mounted])

  const setTheme = useCallback(
    (id: string, { skipValidation = false }: { skipValidation?: boolean } = {}): void => {
      // Wenn skipValidation gesetzt ist (z.B. direkt nach Import), Theme sofort setzen
      if (skipValidation) {
        setThemeState(id)
        localStorage.setItem(THEME_STORAGE_KEY, id)
        return
      }

      // Prüfe, ob Theme in der aktuellen Liste existiert
      const isValid = themes.some((t) => t.id === id)
      if (isValid) {
        setThemeState(id)
        localStorage.setItem(THEME_STORAGE_KEY, id)
      } else {
        // Theme existiert nicht → Fallback auf Default-Theme
        console.warn(
          `[ThemeProvider] Theme "${id}" existiert nicht, fallback auf Default-Theme: ${DEFAULT_THEME_ID}`
        )
        setThemeState(DEFAULT_THEME_ID)
        localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID)
      }
    },
    [themes]
  )

  const setColorMode = useCallback(
    (mode: "light" | "dark" | "system"): void => {
      setNextTheme(mode)
    },
    [setNextTheme]
  )

  const setCornerStyle = useCallback((style: CornerStyle): void => {
    setCornerStyleState(style)
    localStorage.setItem(CORNER_STYLE_STORAGE_KEY, style)
  }, [])

  /**
   * Lädt das Theme-CSS neu (z.B. nach Speichern).
   * Verwendet einen Cache-Buster um Browser-Cache zu umgehen.
   * Gibt true zurück wenn erfolgreich, false bei Fehler.
   */
  const refreshThemeCSS = useCallback(async (): Promise<boolean> => {
    return await loadDynamicThemeCSS(theme, true)
  }, [theme])

  // Bestimme den aktuellen colorMode für den Context
  const colorMode = colorModeValue ?? "system"

  const contextValue: ThemeContextValue = {
    theme,
    setTheme,
    themes,
    colorMode,
    setColorMode,
    refreshThemes,
    isLoading,
    cornerStyle,
    setCornerStyle,
    supportsSquircle,
    refreshThemeCSS,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
}

/**
 * Kombinierter Theme Provider.
 *
 * Integriert:
 * - next-themes für Dark/Light Mode (.dark Klasse auf html)
 * - Custom Theme Provider für TweakCN Themes (data-theme Attribut)
 * - Dynamisches Laden von Themes aus Supabase
 */
export const ThemeProvider = ({
  children,
  defaultTheme,
}: ThemeProviderProps): React.ReactElement => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CustomThemeProvider defaultTheme={defaultTheme}>{children}</CustomThemeProvider>
    </NextThemesProvider>
  )
}
