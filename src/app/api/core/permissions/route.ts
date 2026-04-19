// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

/**
 * Liefert die zentrale Permissions-Matrix aus dem Boilerplate-Core.
 *
 * Bewusst OHNE serverseitigen TTL-Cache: Cache + Next-App-Router-Module-
 * Instanzierung + Cross-Route-Invalidierung haben in der Vergangenheit
 * sporadische Revert-Bugs auf der Rollen-Seite verursacht. Die Procedure
 * ist schnell genug, und Korrektheit schlaegt Mikro-Latenz.
 *
 * @returns Flache Liste von Modul-Berechtigungen.
 */
export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError as NextResponse
  }

  try {
    const coreStore = getCoreStore()
    const permissions = await coreStore.listModulePermissions()
    const mode = coreStore.getMode()

    // Keine HTTP-Cache-Header → Browser/CDN cachen nicht. Der Endpoint ist
    // authentifiziert (pro User), deshalb sowieso nicht CDN-cachebar.
    return NextResponse.json({ mode, permissions }, { headers: { "Cache-Control": "no-store" } })
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
