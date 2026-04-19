// AUTH: authenticated
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { resolveThemeCss } from "@/lib/themes/css"

/**
 * GET /api/themes/css?id=<themeId>
 *
 * Liefert den roh-CSS-Text eines Themes aus dem Storage.
 * Auth-pflichtig (requireAuth).
 *
 * Caching:
 * - 404-Fall: 10 s private (damit neu importierte Themes schnell sichtbar werden)
 * - 200-Fall: 5 min public + stale-while-revalidate
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError as NextResponse
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id || id.includes("/")) {
      return NextResponse.json({ error: "id erforderlich" }, { status: 400 })
    }

    const css = await resolveThemeCss(id)

    if (!css) {
      return NextResponse.json(
        { css: null },
        { headers: { "Cache-Control": "private, max-age=10" } }
      )
    }

    return NextResponse.json(
      { css },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
