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
    const names = Object.fromEntries(
      users
        .filter((entry) => ids.includes(entry.id))
        .map((entry) => [entry.id, entry.displayName || entry.email || "Unbekannt"])
    )

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
