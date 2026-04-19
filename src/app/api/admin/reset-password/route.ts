// AUTH: admin
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"

const ResetSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  newPassword: z.string().min(8).max(200),
})

/**
 * POST /api/admin/reset-password
 *
 * Setzt das Passwort eines Users zurück (nur für Admins).
 * HINWEIS: Nur für Supabase-Auth-User. Clerk-User verwalten Passwort in Clerk.
 */
export async function POST(request: Request) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  const parsed = await parseJsonBody(request, ResetSchema)
  if (!parsed.ok) return parsed.response
  const { userId, newPassword } = parsed.data

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return apiError("CONFIG_MISSING", "NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY fehlen", 500)
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Fehler beim Passwort-Reset:", updateError)
      return apiError("PASSWORD_RESET_FAILED", updateError.message, 500)
    }

    await recordAudit(userOrErr.clerkUserId, "user.password_reset", "user", userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API Error:", error)
    return apiError("INTERNAL", error instanceof Error ? error.message : "Unbekannter Fehler", 500)
  }
}
