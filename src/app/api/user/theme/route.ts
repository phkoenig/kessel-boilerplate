/**
 * API Route: User Theme Preference
 *
 * Lädt und speichert Theme und Color Scheme für den aktuellen User.
 * Berücksichtigt die Berechtigung `can_select_theme`.
 *
 * GET: Lädt das effektive Theme und Color Scheme für den User
 * PUT: Speichert das ausgewählte Theme und/oder Color Scheme
 *
 * Architektur:
 * - selected_theme: Brand-Theme (App-Level mit optionalem User-Override)
 * - color_scheme: Dark/Light Mode Präferenz (User-global über alle Apps)
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"

/**
 * GET /api/user/theme
 *
 * Lädt das effektive Theme für den aktuellen User.
 * Falls User keine Berechtigung hat, wird das Admin-Theme zurückgegeben.
 *
 * Response:
 * - 200: { theme: string, canSelectTheme: boolean, isAdmin: boolean }
 * - 401: Nicht eingeloggt
 * - 500: Server-Fehler
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      // Nicht eingeloggt - Default-Theme zurückgeben
      return NextResponse.json({
        theme: "default",
        colorScheme: "system",
        canSelectTheme: false,
        isAdmin: false,
        isAuthenticated: false,
      })
    }

    const themeState = await getCoreStore().getUserThemeState(userId)
    if (!themeState) {
      return NextResponse.json({
        theme: "default",
        colorScheme: "system",
        canSelectTheme: false,
        isAdmin: false,
        isAuthenticated: true,
        error: "Profil nicht gefunden",
      })
    }

    return NextResponse.json({
      theme: themeState.theme,
      colorScheme: themeState.colorScheme,
      canSelectTheme: themeState.canSelectTheme || themeState.isAdmin,
      isAdmin: themeState.isAdmin,
      isAuthenticated: true,
      usingAdminTheme: !themeState.canSelectTheme && !themeState.isAdmin,
    })
  } catch (error) {
    console.error("[User Theme API] Fehler:", error)
    return NextResponse.json({ error: "Server-Fehler", theme: "default" }, { status: 500 })
  }
}

/**
 * PUT /api/user/theme
 *
 * Speichert das ausgewählte Theme und/oder Color Scheme für den aktuellen User.
 * Nur wenn User eingeloggt und berechtigt ist (für Theme, Color Scheme ist immer erlaubt).
 *
 * Body: { theme?: string, colorScheme?: "dark" | "light" | "system" }
 *
 * Response:
 * - 200: { success: true, theme?: string, colorScheme?: string }
 * - 401: Nicht eingeloggt
 * - 403: Keine Berechtigung (nur für Theme, nicht für Color Scheme)
 * - 400: Ungültige Anfrage
 * - 500: Server-Fehler
 */
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    // Request-Body parsen
    const body = await request.json()
    const { theme, colorScheme } = body

    // Validierung
    if (theme !== undefined && (typeof theme !== "string" || theme.length === 0)) {
      return NextResponse.json({ error: "Theme-ID ungültig" }, { status: 400 })
    }

    if (colorScheme !== undefined && !["dark", "light", "system"].includes(colorScheme)) {
      return NextResponse.json(
        { error: "colorScheme muss 'dark', 'light' oder 'system' sein" },
        { status: 400 }
      )
    }

    // Wenn Theme gesetzt werden soll: Berechtigung prüfen
    if (theme !== undefined) {
      const profile = await getCoreStore().getUserByClerkId(userId)
      if (!profile) {
        return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 500 })
      }

      const isAdmin = profile.role === "admin"
      const canSelectTheme = profile.canSelectTheme ?? true

      if (!canSelectTheme && !isAdmin) {
        return NextResponse.json({ error: "Keine Berechtigung zur Theme-Auswahl" }, { status: 403 })
      }
    }

    // Update-Objekt zusammenstellen (nur gesetzte Felder)
    const updateData: { selected_theme?: string; color_scheme?: string } = {}
    if (theme !== undefined) {
      updateData.selected_theme = theme
    }
    if (colorScheme !== undefined) {
      updateData.color_scheme = colorScheme
    }

    // Wenn nichts zu updaten ist
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Keine Daten zum Aktualisieren" }, { status: 400 })
    }

    const success = await getCoreStore().updateUserThemeState(userId, {
      theme: updateData.selected_theme,
      colorScheme: updateData.color_scheme as "dark" | "light" | "system" | undefined,
    })

    if (!success) {
      return NextResponse.json({ error: "Daten konnten nicht gespeichert werden" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ...(theme !== undefined && { theme }),
      ...(colorScheme !== undefined && { colorScheme }),
    })
  } catch (error) {
    console.error("[User Theme API] Fehler:", error)
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 })
  }
}
