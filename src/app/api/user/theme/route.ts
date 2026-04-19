// AUTH: authenticated
/**
 * API Route: User Theme Preference
 *
 * Nach iryse-Architektur: Es gibt EIN globales Brand-Theme + Color-Scheme fuer ALLE
 * User. Nicht-Admins sehen immer das Admin-Theme (usingAdminTheme=true). Admins
 * koennen per PUT das App-weite Theme aendern; der Server synchronisiert auf alle
 * Admin-Profile und broadcastet via Realtime.
 *
 * GET: Liefert den vollen ThemeSnapshot (Server-berechnet, inkl. cssText).
 * PUT: Speichert Theme/ColorScheme (nur Admins). Liefert aktualisierten Snapshot zurueck.
 */

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user"
import { isAdminRole } from "@/lib/auth/provisioning-role"
import { getCoreStore } from "@/lib/core"
import { NextResponse } from "next/server"
import { getEffectiveThemeSnapshot } from "@/lib/themes/snapshot"
import { THEME_SNAPSHOT_TOPIC, DEFAULT_THEME_ID } from "@/lib/themes/constants"
import { emitRealtimeEvent } from "@/lib/realtime"

/**
 * GET /api/user/theme
 *
 * Liefert den effektiven Theme-Snapshot (inkl. Theme-Liste + aktives CSS).
 * Nicht-Admins erhalten immer das zuletzt gesetzte Admin-Theme.
 */
export async function GET() {
  try {
    const snapshot = await getEffectiveThemeSnapshot()
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
    })
  } catch (error) {
    console.error("[User Theme API] GET Fehler:", error)
    return NextResponse.json(
      {
        error: "Server-Fehler",
        activeThemeId: DEFAULT_THEME_ID,
        theme: DEFAULT_THEME_ID,
        colorScheme: "system",
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/theme
 *
 * Speichert Theme und/oder ColorScheme (nur Admins).
 * Beide Werte werden auf alle Admin-Profile synchronisiert, damit der Snapshot
 * unabhaengig von der DB-Iterationsreihenfolge konsistent bleibt.
 *
 * Body: { theme?: string, colorScheme?: "dark" | "light" | "system" }
 */
export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
    }

    const body = (await request.json()) as {
      theme?: string
      colorScheme?: "dark" | "light" | "system"
    }
    const { theme, colorScheme } = body

    if (theme !== undefined && (typeof theme !== "string" || theme.length === 0)) {
      return NextResponse.json({ error: "Theme-ID ungueltig" }, { status: 400 })
    }

    if (colorScheme !== undefined && !["dark", "light", "system"].includes(colorScheme)) {
      return NextResponse.json(
        { error: "colorScheme muss 'dark', 'light' oder 'system' sein" },
        { status: 400 }
      )
    }

    // Theme-ID ist global + admin-only. Color-Scheme (Dark/Light/System) ist eine
    // individuelle User-Praeferenz und fuer alle erlaubt — sie wird nur im eigenen
    // Profil gespeichert und nicht auf andere Admins synchronisiert.
    if (theme !== undefined && !user.isAdmin) {
      return NextResponse.json(
        { error: "Nur Administratoren duerfen das App-Theme aendern" },
        { status: 403 }
      )
    }

    if (theme === undefined && colorScheme === undefined) {
      return NextResponse.json({ error: "Keine Daten zum Aktualisieren" }, { status: 400 })
    }

    const coreStore = getCoreStore()

    // Admin-only Global-Theme: auf alle Admin-Profile synchronisieren, damit der
    // Snapshot unabhaengig von der DB-Iterationsreihenfolge konsistent bleibt.
    if (theme !== undefined) {
      const allUsers = await coreStore.listUsers()
      const adminUsers = allUsers.filter((u) => isAdminRole(u.role))
      await Promise.all(
        adminUsers.map((admin) =>
          coreStore.updateUserThemeState(admin.clerkUserId, {
            theme,
            ...(user.isAdmin && colorScheme !== undefined ? { colorScheme } : {}),
          })
        )
      )
    }

    // Color-Scheme immer im eigenen Profil persistieren (auch fuer Non-Admins).
    if (colorScheme !== undefined && (theme === undefined || !user.isAdmin)) {
      await coreStore.updateUserThemeState(user.clerkUserId, { colorScheme })
    }

    emitRealtimeEvent(THEME_SNAPSHOT_TOPIC, "theme-updated", {
      profileId: user.profileId,
      theme: theme ?? null,
      colorScheme: colorScheme ?? null,
    })

    const snapshot = await getEffectiveThemeSnapshot()

    return NextResponse.json({
      success: true,
      ...snapshot,
    })
  } catch (error) {
    console.error("[User Theme API] PUT Fehler:", error)
    return NextResponse.json({ error: "Server-Fehler" }, { status: 500 })
  }
}
