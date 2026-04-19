// AUTH: dev-only (hart gegen Production geblockt via Modul-Guard + next.config redirect)
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Dev-Route: Liste aller registrierten User (Supabase Auth).
 *
 * Strikt Dev-only. Plan H-3:
 * - Kein Modul-`throw` bei `NODE_ENV=production` (sonst schlaegt `next build` fehl).
 * - Runtime-Check: 403 wenn nicht Development oder `BOILERPLATE_AUTH_BYPASS !== "true"`.
 * - `next.config.ts redirects()`: leitet `/api/dev/*` in Production hart auf 404.
 *
 * Die Variable heisst **nicht** mehr `NEXT_PUBLIC_AUTH_BYPASS`, damit sie nicht
 * ins Client-Bundle laekt.
 */
export async function GET() {
  const isDev = process.env.NODE_ENV === "development"
  const bypassEnabled = process.env.BOILERPLATE_AUTH_BYPASS === "true"

  if (!isDev || !bypassEnabled) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 })
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error("[DEV API] Fehler beim Laden der User:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userList = users.users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "Unbekannt",
      role: user.user_metadata?.role || "user",
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
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
