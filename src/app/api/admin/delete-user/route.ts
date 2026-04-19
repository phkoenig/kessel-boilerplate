// AUTH: admin
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { createServiceClient } from "@/utils/supabase/service"

const DeleteUserSchema = z.object({
  clerkUserId: z.string().min(1).max(200),
})

/**
 * POST /api/admin/delete-user
 *
 * Loescht einen User komplett (Clerk + Core-Store) - nur fuer Admins.
 */
export async function POST(request: Request) {
  try {
    const userOrErr = await requireAdmin()
    if (userOrErr instanceof Response) return userOrErr
    const adminUser = userOrErr

    const parsed = DeleteUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return apiError("INVALID_PAYLOAD", "Ungueltige Eingabe", 400, parsed.error.issues)
    }
    const { clerkUserId } = parsed.data

    // Verhindere Selbstlöschung
    if (clerkUserId === adminUser.clerkUserId) {
      return NextResponse.json(
        { error: "Du kannst deinen eigenen Account nicht löschen" },
        { status: 400 }
      )
    }

    const coreStore = getCoreStore()
    const existingProfile = await coreStore.getUserByClerkId(clerkUserId)

    if (existingProfile) {
      const supabase = createServiceClient()

      try {
        await supabase.rpc("delete_user_tenant_assignments", {
          p_user_id: existingProfile.id,
        })
      } catch {
        // Membership-Cleanup bleibt best effort, bis der App-DB-Pfad vollstaendig migriert ist.
      }

      await Promise.allSettled([
        supabase.from("feature_votes").delete().eq("user_id", existingProfile.id),
      ])
    }

    await coreStore.deleteUserByClerkId(clerkUserId)

    const clerk = await clerkClient()
    await clerk.users.deleteUser(clerkUserId)

    await recordAudit(adminUser.clerkUserId, "user.deleted", "user", clerkUserId, {
      email: existingProfile?.email ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
