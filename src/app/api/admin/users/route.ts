import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"

interface UserProfileRow {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
}

/**
 * GET /api/admin/users
 *
 * Liefert alle User-Profile für die Admin-Verwaltung.
 * Zugriff nur für Admins; Query läuft mit Service-Role (ohne RLS-Einschränkung).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const userOrErr = await requireAdmin()
    if (userOrErr instanceof Response) return userOrErr

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen" },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await adminClient
      .from("profiles")
      .select("id, email, display_name, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: (data ?? []) as UserProfileRow[],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
