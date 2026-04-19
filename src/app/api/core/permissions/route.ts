// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import {
  getCachedModulePermissions,
  setCachedModulePermissions,
  invalidateModulePermissionsCache,
} from "@/lib/core/permissions-cache"

/**
 * Liefert die zentrale Permissions-Matrix aus dem Boilerplate-Core.
 * Der Client greift damit nicht mehr direkt auf Legacy-Tabellen zu und
 * kann spaeter ohne weitere API-Aenderungen auf Spacetime-Core-Reads
 * umgestellt werden.
 *
 * Der Cache liegt bewusst im shared lib-Modul, damit Schreib-Routen
 * (z. B. `/api/admin/roles/permissions`) ihn verlaesslich invalidieren
 * koennen — siehe `src/lib/core/permissions-cache.ts`.
 *
 * @returns Eine flache Liste von Modulberechtigungen.
 */
export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError as NextResponse
  }

  try {
    const cached = getCachedModulePermissions()
    if (cached) {
      return NextResponse.json(cached)
    }

    const coreStore = getCoreStore()
    const permissions = await coreStore.listModulePermissions()
    const mode = coreStore.getMode()
    setCachedModulePermissions(mode, permissions)

    return NextResponse.json({ mode, permissions })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Permissions konnten nicht geladen werden",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Re-export fuer Konsumenten, die bislang direkt aus dieser Route importiert
// haben. Neuer kanonischer Pfad: `@/lib/core/permissions-cache`.
export { invalidateModulePermissionsCache }
