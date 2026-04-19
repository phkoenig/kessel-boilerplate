// AUTH: authenticated
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { recordAudit } from "@/lib/auth/audit"
import { requireAuth } from "@/lib/auth/get-authenticated-user"

/**
 * POST /api/user/credentials
 *
 * Aendert Passwort oder E-Mail-Adresse des eingeloggten Users ueber Clerk.
 * Ersetzt die frueheren direkten `supabase.auth.updateUser(...)`-Aufrufe aus
 * der Profil-Seite (Plan G1, Boilerplate-DB-Agnostik).
 *
 * Body (mindestens eines der beiden Felder erforderlich):
 * - `password`: neues Passwort (8-200 Zeichen).
 * - `email`:    neue primaere E-Mail-Adresse.
 */
const CredentialsSchema = z
  .object({
    password: z.string().min(8).max(200).optional(),
    email: z.string().trim().email().max(320).optional(),
  })
  .refine((val) => val.password !== undefined || val.email !== undefined, {
    message: "Mindestens 'password' oder 'email' muss angegeben sein",
  })

export async function POST(request: Request) {
  const userOrErr = await requireAuth()
  if (userOrErr instanceof NextResponse) return userOrErr
  const user = userOrErr

  const parsed = await parseJsonBody(request, CredentialsSchema)
  if (!parsed.ok) return parsed.response
  const { password, email } = parsed.data

  const clerk = await clerkClient()

  if (password !== undefined) {
    try {
      await clerk.users.updateUser(user.clerkUserId, { password })
      await recordAudit(user.clerkUserId, "user.password_changed", "user", user.clerkUserId)
    } catch (err) {
      return apiError(
        "PASSWORD_UPDATE_FAILED",
        err instanceof Error ? err.message : "Passwort konnte nicht aktualisiert werden",
        400
      )
    }
  }

  if (email !== undefined) {
    try {
      const created = await clerk.emailAddresses.createEmailAddress({
        userId: user.clerkUserId,
        emailAddress: email,
        verified: true,
        primary: true,
      })
      // Alte Primary-Mails aufraeumen (nur andere Adressen des Users entfernen).
      const fullUser = await clerk.users.getUser(user.clerkUserId)
      await Promise.all(
        fullUser.emailAddresses
          .filter((addr) => addr.id !== created.id)
          .map((addr) => clerk.emailAddresses.deleteEmailAddress(addr.id))
      )
      await recordAudit(user.clerkUserId, "user.email_changed", "user", user.clerkUserId, {
        new_email: email,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "E-Mail konnte nicht aktualisiert werden"
      const alreadyUsed = /already|exists|taken/i.test(message)
      return apiError(
        alreadyUsed ? "EMAIL_ALREADY_USED" : "EMAIL_UPDATE_FAILED",
        alreadyUsed ? "Diese E-Mail-Adresse wird bereits verwendet" : message,
        alreadyUsed ? 409 : 400
      )
    }
  }

  return NextResponse.json({ success: true })
}
