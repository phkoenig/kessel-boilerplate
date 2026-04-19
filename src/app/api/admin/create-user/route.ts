// AUTH: admin
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { recordAudit } from "@/lib/auth/audit"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

const CreateUserSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  displayName: z.string().max(200).optional().nullable(),
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
 * POST /api/admin/create-user
 *
 * Erstellt einen neuen User - nur fuer Admins.
 * Boilerplate 3.0 nutzt dafuer Clerk als Auth-Quelle und schreibt den
 * Rollen-/Profilzustand anschliessend in den Core-Store.
 */
export async function POST(request: Request) {
  try {
    const userOrErr = await requireAdmin()
    if (userOrErr instanceof Response) return userOrErr

    const parsed = CreateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return apiError("INVALID_PAYLOAD", "Ungueltige Eingabe", 400, parsed.error.issues)
    }
    const { email, password, displayName, role } = parsed.data

    const normalizedDisplayName = displayName?.trim() || email.split("@")[0] || "User"
    const nameParts = splitDisplayName(normalizedDisplayName)
    const clerk = await clerkClient()
    const newUser = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
    })

    const primaryEmail =
      newUser.emailAddresses.find((entry) => entry.id === newUser.primaryEmailAddressId)
        ?.emailAddress ??
      newUser.emailAddresses[0]?.emailAddress ??
      email

    const profile = await getCoreStore().upsertUserFromClerk({
      clerkUserId: newUser.id,
      email: primaryEmail,
      displayName: normalizedDisplayName,
      avatarUrl: newUser.imageUrl ?? null,
      role: role || "user",
      tenantId: null,
    })

    await recordAudit(userOrErr.clerkUserId, "user.created", "user", newUser.id, {
      email: primaryEmail,
      role: role || "user",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: profile?.id ?? newUser.id,
        clerkUserId: newUser.id,
        email: primaryEmail,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
