import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

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
    const permissions = await getCoreStore().listModulePermissions()
    return NextResponse.json({
      mode: getCoreStore().getMode(),
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
