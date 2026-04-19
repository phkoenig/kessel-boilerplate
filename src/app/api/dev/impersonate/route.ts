// AUTH: dev-only (hart gegen Production geblockt via Modul-Guard + next.config redirect)
import { clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Dev-Route: User-Impersonation via Clerk Sign-In-Token.
 *
 * Plan G4: Kein Supabase-Magic-Link mehr. Wir erzeugen ueber
 * `clerkClient.signInTokens.createSignInToken` ein Ticket und geben die
 * zugehoerige Sign-In-URL zurueck. Der Client redirected darauf, Clerk
 * setzt die Session-Cookies in seinem eigenen Flow.
 *
 * Strikt Dev-only. Siehe `dev/users/route.ts` fuer Details zum Dev-Guard.
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development"
  const bypassEnabled = process.env.BOILERPLATE_AUTH_BYPASS === "true"

  if (!isDev || !bypassEnabled) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as { userId?: string; email?: string }
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const clerk = await clerkClient()
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 60 * 5,
    })

    if (!signInToken?.token) {
      return NextResponse.json({ error: "Failed to create sign-in token" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId,
      token: signInToken.token,
      signInUrl: `/sign-in?__clerk_ticket=${encodeURIComponent(signInToken.token)}`,
    })
  } catch (error) {
    console.error("[DEV API] Impersonate Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
