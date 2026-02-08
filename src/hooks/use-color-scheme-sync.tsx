"use client"

import { useEffect, useRef } from "react"
import { useTheme as useNextTheme } from "next-themes"
import { useAuth } from "@/components/auth"
import { createClient } from "@/utils/supabase/client"

/**
 * Hook zur Synchronisierung des Color Schemes (Dark/Light Mode) mit dem User-Profil.
 *
 * Funktionsweise:
 * 1. Bei Login: Lädt color_scheme aus DB und setzt next-themes
 * 2. Bei Color-Scheme-Wechsel: Speichert neues Color Scheme in DB
 *
 * WICHTIG: Dieser Hook muss innerhalb von AuthProvider UND ThemeProvider verwendet werden!
 */
export function useColorSchemeSync(): void {
  const { user, isAuthenticated } = useAuth()
  const { theme: currentColorScheme, setTheme: setColorScheme } = useNextTheme()

  // Track ob wir bereits das initiale Sync gemacht haben
  const initialSyncDone = useRef(false)
  // Track den letzten User, um Änderungen zu erkennen
  const lastUserId = useRef<string | null>(null)
  // Track das letzte Color Scheme, um Änderungen zu erkennen
  const lastColorScheme = useRef<string>(currentColorScheme ?? "system")

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC VON DB → CLIENT (bei Login)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Prüfe ob User sich geändert hat (Login/Logout)
    const userChanged = user?.id !== lastUserId.current
    lastUserId.current = user?.id ?? null

    // Bei Logout: Nichts tun (localStorage bleibt)
    if (!isAuthenticated || !user) {
      initialSyncDone.current = false
      return
    }

    // Bei Login: Color Scheme aus DB anwenden
    if (userChanged && user.colorScheme) {
      const dbColorScheme = user.colorScheme

      // Validiere Wert (nur dark, light, system erlaubt)
      if (["dark", "light", "system"].includes(dbColorScheme)) {
        if (dbColorScheme !== currentColorScheme) {
          console.log("[ColorSchemeSync] Applying color scheme from DB:", dbColorScheme)
          setColorScheme(dbColorScheme)
          // localStorage wird von next-themes automatisch aktualisiert
        }
      }

      initialSyncDone.current = true
    }
  }, [user, isAuthenticated, currentColorScheme, setColorScheme])

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC VON CLIENT → DB (bei Color-Scheme-Wechsel)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Nur wenn eingeloggt und Color Scheme sich geändert hat
    if (!isAuthenticated || !user) return
    if (currentColorScheme === lastColorScheme.current) return

    lastColorScheme.current = currentColorScheme ?? "system"

    // Warte bis initiales Sync abgeschlossen ist (verhindert Loop)
    if (!initialSyncDone.current) return

    // Validiere Wert bevor gespeichert wird
    const colorSchemeToSave = ["dark", "light", "system"].includes(currentColorScheme ?? "system")
      ? (currentColorScheme as "dark" | "light" | "system")
      : "system"

    // Speichere in DB
    const saveToDb = async () => {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({ color_scheme: colorSchemeToSave })
        .eq("id", user.id)

      if (error) {
        console.error("[ColorSchemeSync] Failed to save color scheme to DB:", error.message)
      } else {
        console.log("[ColorSchemeSync] Color scheme saved to DB:", colorSchemeToSave)
      }
    }

    saveToDb()
  }, [currentColorScheme, user, isAuthenticated])

  /**
   * Provider-Komponente die den Sync-Hook einbindet.
   * Wird in ClientProviders verwendet.
   */
}

export function ColorSchemeSyncProvider({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  useColorSchemeSync()
  return <>{children}</>
}
