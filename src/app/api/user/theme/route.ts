/**
 * API Route: User Theme Preference
 *
 * Lädt und speichert das Theme für den aktuellen User.
 * Berücksichtigt die Berechtigung `can_select_theme`.
 *
 * GET: Lädt das effektive Theme für den User
 * PUT: Speichert das ausgewählte Theme
 */

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

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
    const supabase = await createClient()

    // Aktuellen User abrufen
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Nicht eingeloggt - Default-Theme zurückgeben
      return NextResponse.json({
        theme: "default",
        canSelectTheme: false,
        isAdmin: false,
        isAuthenticated: false,
      })
    }

    // User-Profil abrufen
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("selected_theme, can_select_theme, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[User Theme API] Profil-Fehler:", profileError)
      return NextResponse.json({
        theme: "default",
        canSelectTheme: false,
        isAdmin: false,
        isAuthenticated: true,
        error: "Profil nicht gefunden",
      })
    }

    const isAdmin = profile.role === "admin"
    const canSelectTheme = profile.can_select_theme ?? true

    // Wenn User keine Berechtigung hat, Admin-Theme laden
    if (!canSelectTheme && !isAdmin) {
      // Admin-Theme abrufen
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("selected_theme")
        .eq("role", "admin")
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      return NextResponse.json({
        theme: adminProfile?.selected_theme || "default",
        canSelectTheme: false,
        isAdmin: false,
        isAuthenticated: true,
        usingAdminTheme: true,
      })
    }

    return NextResponse.json({
      theme: profile.selected_theme || "default",
      canSelectTheme: canSelectTheme || isAdmin,
      isAdmin,
      isAuthenticated: true,
    })
  } catch (error) {
    console.error("[User Theme API] Fehler:", error)
    return NextResponse.json({ error: "Server-Fehler", theme: "default" }, { status: 500 })
  }
}

/**
 * PUT /api/user/theme
 *
 * Speichert das ausgewählte Theme für den aktuellen User.
 * Nur wenn User eingeloggt und berechtigt ist.
 *
 * Body: { theme: string }
 *
 * Response:
 * - 200: { success: true, theme: string }
 * - 401: Nicht eingeloggt
 * - 403: Keine Berechtigung
 * - 400: Ungültige Anfrage
 * - 500: Server-Fehler
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Aktuellen User abrufen
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    // Request-Body parsen
    const body = await request.json()
    const { theme } = body

    if (!theme || typeof theme !== "string") {
      return NextResponse.json({ error: "Theme-ID fehlt oder ungültig" }, { status: 400 })
    }

    // User-Profil abrufen um Berechtigung zu prüfen
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("can_select_theme, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[User Theme API] Profil-Fehler:", profileError)
      return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 500 })
    }

    const isAdmin = profile.role === "admin"
    const canSelectTheme = profile.can_select_theme ?? true

    // Berechtigung prüfen
    if (!canSelectTheme && !isAdmin) {
      return NextResponse.json({ error: "Keine Berechtigung zur Theme-Auswahl" }, { status: 403 })
    }

    // Theme speichern
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ selected_theme: theme })
      .eq("id", user.id)

    if (updateError) {
      console.error("[User Theme API] Update-Fehler:", updateError)
      return NextResponse.json({ error: "Theme konnte nicht gespeichert werden" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      theme,
    })
  } catch (error) {
    console.error("[User Theme API] Fehler:", error)
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 })
  }
}
