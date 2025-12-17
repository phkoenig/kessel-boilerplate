/**
 * API Route: Wiki Content
 *
 * Liefert den Wiki-Content als Plain-Text.
 * Single Source of Truth für Wiki-Seite und AI-Chat.
 */

import { NextResponse } from "next/server"

import { loadWikiContent } from "@/lib/ai-chat/wiki-content"

// Dynamische Route - kein Caching
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const content = await loadWikiContent()

    if (!content) {
      return NextResponse.json({ error: "Wiki content not found" }, { status: 404 })
    }

    // Rückgabe als Plain-Text für einfaches Laden
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        // Kein Cache in Development, Cache in Production
        "Cache-Control":
          process.env.NODE_ENV === "production"
            ? "public, max-age=300, stale-while-revalidate=60"
            : "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Failed to load wiki content:", error)
    return NextResponse.json({ error: "Failed to load wiki content" }, { status: 500 })
  }
}
