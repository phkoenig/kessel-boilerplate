"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth"
import { useTheme } from "@/lib/themes"
import { createClient } from "@/utils/supabase/client"

/**
 * Hook zur Synchronisierung des Themes mit dem User-Profil.
 *
 * Neue Architektur (App-Level Theme mit optionalem User-Override):
 * 1. App-Default-Theme aus NEXT_PUBLIC_DEFAULT_THEME (env) oder "default"
 * 2. Bei Login: Prüft ob User can_select_theme === true UND selected_theme hat
 * 3. Wenn ja: User-Theme verwenden (Override)
 * 4. Wenn nein: App-Default-Theme verwenden
 * 5. Bei Theme-Wechsel: In profiles.selected_theme speichern (nur wenn can_select_theme = true)
 *
 * WICHTIG: Dieser Hook muss innerhalb von AuthProvider UND ThemeProvider verwendet werden!
 */
export function useThemeSyncWithUser(): void {
  const { user, isAuthenticated } = useAuth()
  const { theme, setTheme, themes, isLoading: themesLoading } = useTheme()

  // App-Default-Theme aus Environment-Variable
  const appDefaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

  // Track ob wir bereits das initiale Sync gemacht haben
  const initialSyncDone = useRef(false)
  // Track den letzten User, um Änderungen zu erkennen
  const lastUserId = useRef<string | null>(null)
  // Track das letzte Theme, um Änderungen zu erkennen
  const lastTheme = useRef<string>(theme)

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC VON DB → CLIENT (bei Login)
  // Wird NUR bei User-Wechsel (Login/Logout) ausgeführt, NICHT bei Theme-Änderungen.
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Warte bis Themes geladen sind
    if (themesLoading) return

    // Prüfe ob User sich geändert hat (Login/Logout)
    const userChanged = user?.id !== lastUserId.current
    if (!userChanged) return // Nur bei User-Wechsel agieren

    lastUserId.current = user?.id ?? null

    // Bei Logout: Reset-Tracking, aber NICHT das Theme überschreiben.
    // localStorage behält das aktuelle Theme bei (wird beim nächsten Login ggf. überschrieben).
    if (!isAuthenticated || !user) {
      initialSyncDone.current = false
      return
    }

    // Bei Login: Entscheide zwischen User-Theme (Override) oder App-Default-Theme
    let themeToApply: string | null = null

    // Prüfe ob User Theme-Override erlaubt ist UND ein Theme ausgewählt hat
    if (user.canSelectTheme && user.selectedTheme) {
      const userTheme = user.selectedTheme

      // Prüfe ob User-Theme existiert
      const themeExists = themes.some((t) => t.id === userTheme)

      if (themeExists) {
        themeToApply = userTheme
        console.log("[ThemeSync] Applying user theme override:", userTheme)
      } else {
        console.warn(
          "[ThemeSync] User theme does not exist, keeping current theme"
        )
        // NICHT auf Default zurückfallen - behalte das aktuelle Theme
      }
    }
    // Wenn User kein selectedTheme hat, NICHT auf Default zurückfallen.
    // Das aktuelle Theme (aus localStorage) bleibt bestehen.

    // Theme anwenden NUR wenn wir ein explizites User-Theme haben
    if (themeToApply && themeToApply !== theme) {
      setTheme(themeToApply)
    }

    initialSyncDone.current = true
  }, [user, isAuthenticated, themes, themesLoading, theme, setTheme, appDefaultTheme])

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC VON CLIENT → DB (bei Theme-Wechsel)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Nur wenn eingeloggt und Theme sich geändert hat
    if (!isAuthenticated || !user) return
    if (theme === lastTheme.current) return

    lastTheme.current = theme

    // Warte bis initiales Sync abgeschlossen ist (verhindert Loop)
    if (!initialSyncDone.current) return

    // Nur speichern wenn User Theme-Override erlaubt ist
    // Wenn nicht erlaubt, wird nur localStorage aktualisiert (für Session)
    if (!user.canSelectTheme) {
      console.log("[ThemeSync] User cannot select theme, skipping DB save")
      return
    }

    // Speichere in DB (selected_theme statt theme_preference)
    const saveToDb = async () => {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({ selected_theme: theme })
        .eq("id", user.id)

      if (error) {
        console.error("[ThemeSync] Failed to save theme to DB:", error.message)
      } else {
        console.log("[ThemeSync] Theme saved to DB (selected_theme):", theme)
      }
    }

    saveToDb()
  }, [theme, user, isAuthenticated])
}

/**
 * Provider-Komponente die den Sync-Hook einbindet.
 * Wird in ClientProviders verwendet.
 */
export function ThemeSyncProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  useThemeSyncWithUser()
  return <>{children}</>
}
