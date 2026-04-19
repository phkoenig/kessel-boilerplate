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
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { getEffectiveThemeSnapshot } from "@/lib/themes/snapshot"
import { THEME_SNAPSHOT_TOPIC, DEFAULT_THEME_ID } from "@/lib/themes/constants"
import { emitRealtimeEvent } from "@/lib/realtime"

const PutSchema = z
  .object({
    theme: z.string().trim().min(1).max(100).optional(),
    colorScheme: z.enum(["dark", "light", "system"]).optional(),
  })
  .refine((v) => v.theme !== undefined || v.colorScheme !== undefined, {
    message: "Keine Daten zum Aktualisieren",
  })

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
      return apiError("UNAUTHORIZED", "Nicht eingeloggt", 401)
    }

    const parsed = await parseJsonBody(request, PutSchema)
    if (!parsed.ok) return parsed.response
    const { theme, colorScheme } = parsed.data

    // Theme-ID ist global + admin-only. Color-Scheme (Dark/Light/System) ist eine
    // individuelle User-Praeferenz und fuer alle erlaubt — sie wird nur im eigenen
    // Profil gespeichert und nicht auf andere Admins synchronisiert.
    if (theme !== undefined && !user.isAdmin) {
      return apiError("FORBIDDEN", "Nur Administratoren duerfen das App-Theme aendern", 403)
    }

    const coreStore = getCoreStore()

    // Admin-only Global-Theme: auf alle Admin-Profile synchronisieren, damit der
    // Snapshot unabhaengig von der DB-Iterationsreihenfolge konsistent bleibt.
    // WICHTIG: listUsers() kann den aktuellen Admin aus Timing-/Sync-Gruenden fehlen —
    // ohne Eintraege schlaegt die Persistenz fehl (leeres Promise.all). Daher immer
    // die Clerk-ID des eingeloggten Admins in die Sync-Menge aufnehmen.
    if (theme !== undefined) {
      const allUsers = await coreStore.listUsers()
      const adminClerkIds = new Set(
        allUsers.filter((u) => isAdminRole(u.role)).map((u) => u.clerkUserId)
      )
      if (user.isAdmin) {
        adminClerkIds.add(user.clerkUserId)
      }
      await Promise.all(
        [...adminClerkIds].map((clerkUserId) =>
          coreStore.updateUserThemeState(clerkUserId, { theme })
        )
      )
    }

    // Color-Scheme ist eine persoenliche Praeferenz und wird NIE auf andere
    // Admin-Profile synchronisiert — immer nur ins eigene Profil schreiben.
    if (colorScheme !== undefined) {
      await coreStore.updateUserThemeState(user.clerkUserId, { colorScheme })
    }

    try {
      emitRealtimeEvent(THEME_SNAPSHOT_TOPIC, "theme-updated", {
        profileId: user.profileId,
        theme: theme ?? null,
        colorScheme: colorScheme ?? null,
      })
    } catch (emitErr) {
      console.warn("[User Theme API] Realtime-Emit optional fehlgeschlagen:", emitErr)
    }

    const snapshot = await getEffectiveThemeSnapshot()

    return NextResponse.json({
      success: true,
      ...snapshot,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server-Fehler"
    console.error("[User Theme API] PUT Fehler:", error)
    const clientMessage = process.env.NODE_ENV === "production" ? "Server-Fehler" : message
    return apiError("INTERNAL", clientMessage, 500)
  }
}
