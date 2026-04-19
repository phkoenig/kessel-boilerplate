// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { ensureNavigationBootstrapped } from "@/lib/navigation/bootstrap"

const NAVIGATION_CACHE_TTL_MS = 60_000
type NavigationItems = Awaited<ReturnType<ReturnType<typeof getCoreStore>["listNavigationItems"]>>

let navigationCache: { mode: string; items: NavigationItems; expiresAt: number } | null = null

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
    if (navigationCache && navigationCache.expiresAt > Date.now()) {
      return NextResponse.json({
        mode: navigationCache.mode,
        items: navigationCache.items,
      })
    }

    await ensureNavigationBootstrapped()
    const coreStore = getCoreStore()
    const items = await coreStore.listNavigationItems()
    navigationCache = {
      mode: coreStore.getMode(),
      items,
      expiresAt: Date.now() + NAVIGATION_CACHE_TTL_MS,
    }

    return NextResponse.json({
      mode: navigationCache.mode,
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
