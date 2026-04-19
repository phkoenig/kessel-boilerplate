// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const PERMISSIONS_CACHE_TTL_MS = 60_000
type ModulePermissions = Awaited<
  ReturnType<ReturnType<typeof getCoreStore>["listModulePermissions"]>
>

let permissionsCache: { mode: string; permissions: ModulePermissions; expiresAt: number } | null =
  null

/**
 * Liefert die zentrale Permissions-Matrix aus dem Boilerplate-Core.
 * Der Client greift damit nicht mehr direkt auf Legacy-Tabellen zu und
 * kann spaeter ohne weitere API-Aenderungen auf Spacetime-Core-Reads
 * umgestellt werden.
 *
 * @returns Eine flache Liste von Modulberechtigungen.
 */
export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError as NextResponse
  }

  try {
    if (permissionsCache && permissionsCache.expiresAt > Date.now()) {
      return NextResponse.json({
        mode: permissionsCache.mode,
        permissions: permissionsCache.permissions,
      })
    }

    const coreStore = getCoreStore()
    const permissions = await coreStore.listModulePermissions()
    permissionsCache = {
      mode: coreStore.getMode(),
      permissions,
      expiresAt: Date.now() + PERMISSIONS_CACHE_TTL_MS,
    }

    return NextResponse.json({
      mode: permissionsCache.mode,
      permissions,
    })
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
