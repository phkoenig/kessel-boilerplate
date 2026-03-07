import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"

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

    // Request Body lesen
    const { email, password, displayName, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort sind erforderlich" }, { status: 400 })
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen haben" },
        { status: 400 }
      )
    }

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
