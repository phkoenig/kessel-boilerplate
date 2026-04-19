// AUTH: authenticated
/**
 * API Route: Available Media Providers
 *
 * Gibt verfügbare Media-Provider zurück (für Frontend-Dropdown).
 * Auth: authentifiziert (Plan H-9) - Provider-Liste ist nicht oeffentlich.
 */

import { requireAuth } from "@/lib/auth/guards"
import { getAvailableProviders } from "@/lib/media"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    const userOrErr = await requireAuth()
    if (userOrErr instanceof Response) return userOrErr as NextResponse
    const providers = getAvailableProviders()

    return NextResponse.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        models: Object.keys(p.models),
        defaultModel: p.defaultModel,
      })),
    })
  } catch (error) {
    console.error("[Media Providers API] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
