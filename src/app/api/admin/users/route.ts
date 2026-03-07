import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

interface UserProfileRow {
  id: string
  clerkUserId: string
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
    const users = await getCoreStore().listUsers()

    return NextResponse.json({
      success: true,
      users: users.map(
        (user): UserProfileRow => ({
          id: user.id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          display_name: user.displayName,
          role: user.role,
          created_at: user.createdAt,
        })
      ),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
