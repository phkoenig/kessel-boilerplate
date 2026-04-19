// AUTH: admin
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const UpdateUserSchema = z.object({
  clerkUserId: z.string().min(1).max(200),
  email: z.string().email().max(320).optional(),
  displayName: z.string().max(200).nullable().optional(),
  role: z.string().max(64).optional(),
})

const splitDisplayName = (
  value: string | null | undefined
): { firstName?: string; lastName?: string } => {
  const normalized = value?.trim()
  if (!normalized) {
    return {}
  }

  const [firstName, ...rest] = normalized.split(/\s+/)
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : undefined,
  }
}

/**
 * POST /api/admin/update-user
 *
 * Aktualisiert User-Daten (E-Mail) - nur für Admins
 */
export async function POST(request: Request) {
  try {
    const userOrErr = await requireAdmin()
    if (userOrErr instanceof Response) return userOrErr

    const parsed = UpdateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return apiError("INVALID_PAYLOAD", "Ungueltige Eingabe", 400, parsed.error.issues)
    }
    const { clerkUserId, email, displayName, role } = parsed.data

    const coreStore = getCoreStore()
    const existingProfile = await coreStore.getUserByClerkId(clerkUserId)
    if (!existingProfile) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 })
    }

    const nextEmail = email?.trim() || existingProfile.email
    const nextDisplayName =
      displayName !== undefined
        ? displayName?.trim() || existingProfile.displayName || existingProfile.email
        : (existingProfile.displayName ?? existingProfile.email)
    const nextRole = role?.trim() || existingProfile.role

    const clerk = await clerkClient()

    if (email !== undefined && nextEmail !== existingProfile.email) {
      const clerkUser = await clerk.users.getUser(clerkUserId)
      const existingAddress = clerkUser.emailAddresses.find(
        (entry) => entry.emailAddress.toLowerCase() === nextEmail.toLowerCase()
      )

      if (existingAddress) {
        await clerk.users.updateUser(clerkUserId, {
          primaryEmailAddressID: existingAddress.id,
          notifyPrimaryEmailAddressChanged: false,
        })
      } else {
        await clerk.emailAddresses.createEmailAddress({
          userId: clerkUserId,
          emailAddress: nextEmail,
          primary: true,
          verified: true,
        })
      }
    }

    if (displayName !== undefined) {
      const nameParts = splitDisplayName(nextDisplayName)
      await clerk.users.updateUser(clerkUserId, {
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
      })
    }

    const updatedProfile = await coreStore.upsertUserFromClerk({
      clerkUserId,
      email: nextEmail,
      displayName: nextDisplayName ?? existingProfile.displayName ?? existingProfile.email,
      avatarUrl: existingProfile.avatarUrl,
      role: nextRole,
      tenantId: existingProfile.tenantId,
    })

    const detailChanges: Record<string, unknown> = {}
    if (nextEmail !== existingProfile.email) {
      detailChanges.email = { before: existingProfile.email, after: nextEmail }
    }
    if (nextRole !== existingProfile.role) {
      detailChanges.role = { before: existingProfile.role, after: nextRole }
    }
    if (displayName !== undefined && nextDisplayName !== existingProfile.displayName) {
      detailChanges.displayName = { before: existingProfile.displayName, after: nextDisplayName }
    }
    if (Object.keys(detailChanges).length > 0) {
      await recordAudit(
        userOrErr.clerkUserId,
        nextRole !== existingProfile.role ? "user.role_changed" : "user.updated",
        "user",
        clerkUserId,
        detailChanges
      )
    }

    return NextResponse.json({ success: true, user: updatedProfile })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
