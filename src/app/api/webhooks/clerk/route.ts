/**
 * Clerk Webhook Endpoint
 *
 * Syncs Clerk Lifecycle Events in den Boilerplate-Core (SpacetimeDB):
 * - `user.created`, `user.updated`, `user.deleted` → User-Shadow / Profil
 *
 * Signing Secret: `CLERK_WEBHOOK_SIGNING_SECRET` (1Password → `pnpm pull-env`).
 */

import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { type NextRequest, NextResponse } from "next/server"
import { resolveBoilerplateProvisioningRole } from "@/lib/auth/provisioning-role"
import { getCoreStore } from "@/lib/core"
import { getSpacetimeServerConnection } from "@/lib/spacetime/server-connection"

interface ClerkUserData {
  id: string
  email_addresses?: Array<{ email_address: string; id?: string }>
  emailAddresses?: Array<{ emailAddress?: string; id?: string }>
  primary_email_address_id?: string | null
  primaryEmailAddressId?: string | null
  first_name?: string | null
  lastName?: string | null
  last_name?: string | null
  image_url?: string | null
  imageUrl?: string | null
}

function getPrimaryEmail(data: ClerkUserData): string {
  const emails = data.email_addresses ?? data.emailAddresses
  if (!emails?.length) return ""
  const primaryId = data.primary_email_address_id ?? data.primaryEmailAddressId
  const primary =
    primaryId && Array.isArray(emails)
      ? emails.find((e: { id?: string }) => e.id === primaryId)
      : null
  const fallback = Array.isArray(emails) ? emails[0] : null
  const chosen = primary ?? fallback
  if (!chosen) return ""
  return (
    (chosen as { email_address?: string }).email_address ??
    (chosen as { emailAddress?: string }).emailAddress ??
    ""
  )
}

function getDisplayName(data: ClerkUserData): string {
  const first = data.first_name ?? ""
  const last = (data.last_name ?? data.lastName ?? "") as string
  const combined = [first, last].filter(Boolean).join(" ")
  if (combined.trim()) return combined.trim()
  const email = getPrimaryEmail(data)
  return email ? (email.split("@")[0] ?? "User") : "User"
}

export async function POST(request: NextRequest) {
  try {
    const evt = await verifyWebhook(request)
    const coreStore = getCoreStore()

    // Webhook-Idempotenz (Plan M-11):
    // Svix liefert eine stabile `svix-id` pro Zustellung. Wir protokollieren
    // das Event im Core (DB-seitig idempotent: nur erster Insert pro
    // externalEventId gewinnt). Bei doppelten Zustellungen gewinnen die
    // darunter liegenden Upserts ohnehin (idempotent), so dass ein
    // Fruehabbruch optional ist.
    const svixId = request.headers.get("svix-id") ?? `clerk-${Date.now()}`
    try {
      const connection = await getSpacetimeServerConnection()
      await connection.reducers.logWebhookEvent({
        externalEventId: svixId,
        source: "clerk",
        payloadJson: JSON.stringify({ type: evt.type }),
      })
    } catch (logErr) {
      console.warn("[webhooks/clerk] logWebhookEvent failed (non-fatal):", logErr)
    }

    if (evt.type === "user.created") {
      const data = evt.data as ClerkUserData
      const email = getPrimaryEmail(data)
      const effectiveEmail = email || "unknown@clerk.local"
      const mappedRole = await resolveBoilerplateProvisioningRole(coreStore, null, effectiveEmail, {
        mode: "initial",
      })

      const profile = await coreStore.upsertUserFromClerk({
        clerkUserId: data.id,
        email: effectiveEmail,
        displayName: getDisplayName(data),
        avatarUrl: data.image_url ?? data.imageUrl ?? null,
        role: mappedRole,
      })
      if (!profile) {
        return NextResponse.json({ error: "Profil konnte nicht angelegt werden" }, { status: 500 })
      }
    } else if (evt.type === "user.updated") {
      const data = evt.data as ClerkUserData
      const email = getPrimaryEmail(data)
      const existingProfile = await coreStore.getUserByClerkId(data.id)
      const effectiveEmail = email || existingProfile?.email || "unknown@clerk.local"
      const mappedRole = await resolveBoilerplateProvisioningRole(
        coreStore,
        existingProfile?.role ?? null,
        effectiveEmail,
        { mode: "sync" }
      )

      const profile = await coreStore.upsertUserFromClerk({
        clerkUserId: data.id,
        email: effectiveEmail,
        displayName: getDisplayName(data),
        avatarUrl: data.image_url ?? data.imageUrl ?? null,
        role: mappedRole,
        tenantId: existingProfile?.tenantId ?? null,
      })
      if (!profile) {
        return NextResponse.json(
          { error: "Profil konnte nicht aktualisiert werden" },
          { status: 500 }
        )
      }
    } else if (evt.type === "user.deleted") {
      const data = evt.data as { id?: string }
      const clerkId = data?.id
      if (!clerkId) {
        return NextResponse.json({ error: "Keine User-ID im Event" }, { status: 400 })
      }
      const success = await coreStore.deleteUserByClerkId(clerkId)
      if (!success) {
        return NextResponse.json({ error: "Profil konnte nicht geloescht werden" }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Webhook-Verifizierung fehlgeschlagen", details: String(err) },
      { status: 401 }
    )
  }
}
