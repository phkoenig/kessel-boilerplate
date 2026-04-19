// AUTH: authenticated
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

export async function POST(request: Request): Promise<NextResponse> {
  const userOrError = await requireAuth()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const body = (await request.json()) as { ids?: string[] }
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter(Boolean))] : []

    if (ids.length === 0) {
      return NextResponse.json({ names: {} })
    }

    const users = await getCoreStore().listUsers()
    const idSet = new Set(ids)
    // Wir matchen sowohl auf die persistente Core-ID als auch auf die Clerk-ID,
    // damit Beispiel-Features wie Bug-Report (speichert clerkUserId) und
    // Admin-Views (nutzen Core-ID) dasselbe Endpoint verwenden koennen.
    const entries: [string, string][] = []
    for (const entry of users) {
      const label = entry.displayName || entry.email || "Unbekannt"
      if (idSet.has(entry.id)) entries.push([entry.id, label])
      if (entry.clerkUserId && idSet.has(entry.clerkUserId)) {
        entries.push([entry.clerkUserId, label])
      }
    }
    const names = Object.fromEntries(entries)

    return NextResponse.json({ names })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Display-Namen konnten nicht geladen werden",
      },
      { status: 500 }
    )
  }
}
