// AUTH: public (bewusst oeffentlich - Dokumentations-Content)
import { NextResponse } from "next/server"

import { loadPublicWikiContent } from "@/lib/ai-chat/wiki-content"

export const dynamic = "force-dynamic"

/**
 * API Route: Public Wiki Content
 *
 * Liefert die oeffentliche, read-only Wiki-Dokumentation als Markdown.
 * Auth: bewusst oeffentlich (Plan H-9) - dient als Public-Info-Endpoint
 * und darf im unauth Wiki-Viewer angezeigt werden. Nur Read-Only.
 */
export async function GET() {
  try {
    const content = await loadPublicWikiContent()

    if (!content) {
      return NextResponse.json({ error: "Public wiki content not found" }, { status: 404 })
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control":
          process.env.NODE_ENV === "production"
            ? "public, max-age=300, stale-while-revalidate=60"
            : "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Failed to load public wiki content:", error)
    return NextResponse.json({ error: "Failed to load public wiki content" }, { status: 500 })
  }
}
