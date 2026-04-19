// AUTH: admin
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"

const ResetSchema = z.object({
  clerkUserId: z.string().trim().min(1).max(200),
  newPassword: z.string().min(8).max(200),
})

/**
 * POST /api/admin/reset-password
 *
 * Setzt das Passwort eines Users zurueck (nur fuer Admins).
 * Plan G2: laeuft jetzt ausschliesslich ueber Clerk. Die `userId`-Payload
 * ist aequivalent zur Clerk-User-ID (frueher Supabase-User-UUID).
 */
export async function POST(request: Request) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  const parsed = await parseJsonBody(request, ResetSchema)
  if (!parsed.ok) return parsed.response
  const { clerkUserId, newPassword } = parsed.data

  try {
    const clerk = await clerkClient()
    await clerk.users.updateUser(clerkUserId, { password: newPassword })

    await recordAudit(userOrErr.clerkUserId, "user.password_reset", "user", clerkUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin/reset-password]", error)
    return apiError(
      "PASSWORD_RESET_FAILED",
      error instanceof Error ? error.message : "Unbekannter Fehler",
      500
    )
  }
}
