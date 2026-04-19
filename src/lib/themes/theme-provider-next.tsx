"use client"

/**
 * ThemeProvider (iryse): ThemeStore + Server-Snapshot; kein localStorage fuer Brand-Theme.
 */

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

import { loadGoogleFonts } from "@/lib/fonts"
import {
  primeThemeStore,
  refreshThemeStore,
  setThemeStoreColorScheme,
  setThemeStoreCornerStyle,
  setThemeStoreTheme,
  setThemeStoreThemeScope,
  useThemeStoreSnapshot,
} from "@/lib/themes/theme-store"
import { applyActiveThemeCss } from "@/lib/themes/apply-active-theme-css"
import { THEME_SNAPSHOT_TOPIC } from "@/lib/themes/constants"
import type { ThemeSnapshot } from "@/lib/themes/types"
import type { CornerStyle, ThemeContextValue, ThemeMeta } from "./types"
import { getRealtimeAdapter } from "@/lib/realtime"

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface NextThemeProviderProps {
  children: ReactNode
  /** Server-Snapshot (Layout injiziert ihn). Wenn null, laedt der Store selbst. */
  initialSnapshot?: ThemeSnapshot | null
}

function CustomNextThemeProvider({
  children,
  initialSnapshot,
}: NextThemeProviderProps): React.ReactElement {
  const { theme: colorModeValue, setTheme: setNextTheme } = useNextTheme()
  const snapshot = useThemeStoreSnapshot()
  const primedRef = useRef(false)

  // Prime store mit dem Server-Snapshot (nur einmal, pro Seite).
  useEffect(() => {
    if (!primedRef.current && initialSnapshot) {
      primeThemeStore(initialSnapshot)
      primedRef.current = true
    }
  }, [initialSnapshot])

  // Initial laden, falls kein Snapshot injiziert wurde.
  useEffect(() => {
    if (initialSnapshot) return
    if (primedRef.current) return
    primedRef.current = true
    void refreshThemeStore()
  }, [initialSnapshot])

  useEffect(() => {
    const adapter = getRealtimeAdapter()
    void adapter.connect().catch(() => undefined)
    const subA = adapter.subscribe(THEME_SNAPSHOT_TOPIC, () => {
      void refreshThemeStore()
    })
    const subB = adapter.subscribe("themes:updated", () => {
      void refreshThemeStore()
    })
    return () => {
      subA.unsubscribe()
      subB.unsubscribe()
    }
  }, [])

  // data-theme + data-corner-style schreiben + CSS injizieren.
  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.setAttribute("data-theme", snapshot.activeThemeId)
    document.documentElement.setAttribute("data-corner-style", snapshot.cornerStyle)
    applyActiveThemeCss(snapshot.cssText)
  }, [snapshot.activeThemeId, snapshot.cornerStyle, snapshot.cssText])

  // Fonts laden, falls das aktive Theme dynamische Fonts verlangt.
  useEffect(() => {
    const current = snapshot.themes.find((t) => t.id === snapshot.activeThemeId)
    if (!current || current.dynamicFonts.length === 0) return
    loadGoogleFonts(current.dynamicFonts).catch((err) => {
      console.error("Fehler beim Laden dynamischer Fonts:", err)
    })
  }, [snapshot.activeThemeId, snapshot.themes])

  // ColorMode aus Snapshot an next-themes pushen, aber NUR wenn der Snapshot
  // tatsaechlich einen neuen Wert liefert (z.B. via Realtime-Broadcast aus einem
  // anderen Tab). Ohne diese Abgrenzung wuerde ein lokaler Switch-Click sofort
  // vom (noch nicht refresh'ten) Snapshot-Wert zurueckgerollt werden.
  const lastSnapshotColorScheme = useRef(snapshot.colorScheme)
  useEffect(() => {
    if (snapshot.colorScheme === lastSnapshotColorScheme.current) return
    lastSnapshotColorScheme.current = snapshot.colorScheme
    if (snapshot.colorScheme && snapshot.colorScheme !== colorModeValue) {
      setNextTheme(snapshot.colorScheme)
    }
  }, [snapshot.colorScheme, colorModeValue, setNextTheme])

  const themesForContext: ThemeMeta[] = useMemo(() => snapshot.themes, [snapshot.themes])

  const setTheme = useCallback(
    (id: string, { skipValidation = false }: { skipValidation?: boolean } = {}): void => {
      const target = skipValidation || snapshot.themes.some((t) => t.id === id) ? id : "default"
      void setThemeStoreTheme(target).catch((err) => {
        console.error("[ThemeProvider] setTheme fehlgeschlagen:", err)
      })
    },
    [snapshot.themes]
  )

  const setColorMode = useCallback(
    (mode: "light" | "dark" | "system"): void => {
      setNextTheme(mode)
      if (snapshot.canManageAppTheme) {
        void setThemeStoreColorScheme(mode).catch((err) => {
          console.error("[ThemeProvider] setColorScheme fehlgeschlagen:", err)
        })
      }
    },
    [setNextTheme, snapshot.canManageAppTheme]
  )

  const setCornerStyle = useCallback((style: CornerStyle): void => {
    setThemeStoreCornerStyle(style)
  }, [])

  const setThemeScope = useCallback(async (scope: "global" | "per_user"): Promise<void> => {
    await setThemeStoreThemeScope(scope)
  }, [])

  const refreshThemes = useCallback(async (): Promise<ThemeMeta[]> => {
    await refreshThemeStore()
    return themesForContext
  }, [themesForContext])

  const refreshThemeCSS = useCallback(async (): Promise<boolean> => {
    await refreshThemeStore()
    return true
  }, [])

  const supportsSquircle =
    typeof CSS !== "undefined" && CSS.supports ? CSS.supports("corner-shape", "squircle") : false

  const contextValue: ThemeContextValue = {
    theme: snapshot.activeThemeId,
    setTheme,
    themes: themesForContext,
    colorMode: colorModeValue ?? snapshot.colorScheme,
    setColorMode,
    refreshThemes,
    isLoading: snapshot.isLoading,
    cornerStyle: snapshot.cornerStyle,
    setCornerStyle,
    supportsSquircle,
    refreshThemeCSS,
    themeScope: snapshot.themeScope,
    isAdmin: snapshot.isAdmin,
    setThemeScope,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

interface ThemeProviderNextProps {
  children: ReactNode
  /** Server-Snapshot aus RSC-Layout (empfohlen, sonst Client-Fetch). */
  initialSnapshot?: ThemeSnapshot | null
}

/**
 * Neuer kombinierter Theme-Provider (iryse-basiert).
 */
export const ThemeProviderNext = ({
  children,
  initialSnapshot,
}: ThemeProviderNextProps): React.ReactElement => {
  const defaultColorMode = initialSnapshot?.colorScheme ?? "system"
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultColorMode}
      enableSystem
      disableTransitionOnChange
    >
      <CustomNextThemeProvider initialSnapshot={initialSnapshot}>
        {children}
      </CustomNextThemeProvider>
    </NextThemesProvider>
  )
}
