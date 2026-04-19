// AUTH: dev-only (hart gegen Production geblockt via Modul-Guard + next.config redirect)
import { NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"

/**
 * Dev-Route: Liste aller registrierten User.
 *
 * Plan G4: Liest ausschliesslich aus dem Spacetime-Core (kein Supabase mehr).
 * Siehe `dev/impersonate/route.ts` fuer Details zum Dev-Guard.
 */
export async function GET() {
  const isDev = process.env.NODE_ENV === "development"
  const bypassEnabled = process.env.BOILERPLATE_AUTH_BYPASS === "true"

  if (!isDev || !bypassEnabled) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const coreStore = getCoreStore()
    const users = await coreStore.listUsers()

    const userList = users.map((user) => ({
      id: user.clerkUserId,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Unbekannt",
      role: user.role,
      createdAt: user.createdAt,
      lastSignIn: null,
    }))

    return NextResponse.json({ users: userList })
  } catch (error) {
    console.error("[DEV API] Unerwarteter Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
