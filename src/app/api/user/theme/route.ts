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
import { getTenantSlug } from "@/lib/branding"
import { getCoreStore } from "@/lib/core"
import { invalidateAppSettingsCache } from "@/lib/core/server-cache"
// isAdminRole wird nicht mehr benoetigt: Sync auf alle Admin-Profile entfaellt,
// da das globale Theme jetzt direkt in app_settings.globalThemeId liegt.
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
    themeScope: z.enum(["global", "per_user"]).optional(),
  })
  .refine(
    (v) => v.theme !== undefined || v.colorScheme !== undefined || v.themeScope !== undefined,
    { message: "Keine Daten zum Aktualisieren" }
  )

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
    const { theme, colorScheme, themeScope: nextThemeScope } = parsed.data

    const coreStore = getCoreStore()
    const tenantSlug = getTenantSlug()
    const appSettings = await coreStore.getAppSettings(tenantSlug)

    // Theme-Scope-Switch: nur Admins. Wird ZUERST verarbeitet, damit ein
    // gleichzeitiges theme-Update bereits gegen den neuen Scope geprueft wird.
    if (nextThemeScope !== undefined) {
      if (!user.isAdmin) {
        return apiError("FORBIDDEN", "Nur Administratoren duerfen den Theme-Scope aendern", 403)
      }
      if (appSettings?.themeScope !== nextThemeScope) {
        await coreStore.upsertAppSettings(tenantSlug, { themeScope: nextThemeScope })
        invalidateAppSettingsCache(tenantSlug)
      }
    }

    const effectiveScope: "global" | "per_user" =
      nextThemeScope ?? (appSettings?.themeScope === "per_user" ? "per_user" : "global")
    const themeScope = effectiveScope

    // Im global-Modus ist Theme-Aenderung admin-only und schreibt nach
    // app_settings.globalThemeId. Im per_user-Modus darf jeder eingeloggte
    // User sein eigenes Theme aendern; gespeichert wird im UserThemeState.
    if (theme !== undefined) {
      if (themeScope === "global") {
        if (!user.isAdmin) {
          return apiError(
            "FORBIDDEN",
            "Nur Administratoren duerfen das App-weite Theme aendern",
            403
          )
        }
        await coreStore.upsertAppSettings(tenantSlug, { globalThemeId: theme })
        invalidateAppSettingsCache(tenantSlug)
      } else {
        await coreStore.updateUserThemeState(user.clerkUserId, { theme })
      }
    }

    // Color-Scheme bleibt IMMER eine persoenliche User-Praeferenz, unabhaengig
    // vom Theme-Scope. Wird nur im eigenen Profil gespeichert.
    if (colorScheme !== undefined) {
      await coreStore.updateUserThemeState(user.clerkUserId, { colorScheme })
    }

    try {
      emitRealtimeEvent(THEME_SNAPSHOT_TOPIC, "theme-updated", {
        profileId: user.profileId,
        theme: theme ?? null,
        colorScheme: colorScheme ?? null,
        themeScope: nextThemeScope ?? null,
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
