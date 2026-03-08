import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { ensureNavigationBootstrapped } from "@/lib/navigation/bootstrap"

/**
 * Liefert die produktive Navigationsstruktur aus dem Boilerplate-Core.
 * URLs, Breadcrumbs, Page Titles und Menues lesen damit denselben
 * Spacetime-basierten Datenpfad.
 */
export async function GET(): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError as NextResponse
  }

  try {
    await ensureNavigationBootstrapped()
    const items = await getCoreStore().listNavigationItems()

    return NextResponse.json({
      mode: getCoreStore().getMode(),
      items,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Navigation konnte nicht geladen werden",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
