/**
 * Clerk Webhook Endpoint
 *
 * Syncs Clerk Lifecycle Events -> Supabase:
 * - User: profiles
 * - Organization: app.tenants (clerk_org_id)
 * - OrganizationMembership: app.user_tenants
 *
 * Signing Secret: CLERK_WEBHOOK_SIGNING_SECRET (Vault)
 */

import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { type NextRequest, NextResponse } from "next/server"
import { resolveProvisioningRole } from "@/lib/auth/allowed-users"
import { getCoreStore } from "@/lib/core"

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

    if (evt.type === "user.created") {
      const data = evt.data as ClerkUserData
      const email = getPrimaryEmail(data)
      const knownRoles = (await coreStore.listUsers()).map((entry) => entry.role)
      const mappedRole = resolveProvisioningRole(email, null, knownRoles)
      if (!mappedRole) {
        return NextResponse.json({ received: true, ignored: "email-not-allowlisted" })
      }

      const profile = await coreStore.upsertUserFromClerk({
        clerkUserId: data.id,
        email: email || "unknown@clerk.local",
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
      const knownRoles = (await coreStore.listUsers()).map((entry) => entry.role)
      const mappedRole = resolveProvisioningRole(email, existingProfile?.role ?? null, knownRoles)
      if (!mappedRole) {
        await coreStore.deleteUserByClerkId(data.id)
        return NextResponse.json({ received: true, ignored: "email-not-allowlisted" })
      }
      const profile = await coreStore.upsertUserFromClerk({
        clerkUserId: data.id,
        email: email || "unknown@clerk.local",
        displayName: getDisplayName(data),
        avatarUrl: data.image_url ?? data.imageUrl ?? null,
        role: mappedRole,
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
    } else if (evt.type === "organization.created") {
      const data = evt.data as { id?: string; name?: string; slug?: string }
      if (!data?.id) {
        return NextResponse.json({ error: "Keine Org-ID im Event" }, { status: 400 })
      }
      const slug = (data.slug ?? data.name ?? data.id).toLowerCase().replace(/\s+/g, "_")
      const tenantId = await coreStore.upsertTenant({
        clerkOrgId: data.id,
        slug,
        name: data.name ?? data.id,
      })
      if (!tenantId) {
        return NextResponse.json({ error: "Tenant konnte nicht angelegt werden" }, { status: 500 })
      }
    } else if (evt.type === "organizationMembership.created") {
      const data = evt.data as {
        organization?: { id?: string }
        public_user_data?: { user_id?: string }
      }
      const orgId = data.organization?.id ?? (data as { organization_id?: string }).organization_id
      const clerkUserId =
        data.public_user_data?.user_id ??
        (data as { public_user_data?: { user_id?: string } }).public_user_data?.user_id
      if (!orgId || !clerkUserId) {
        return NextResponse.json(
          { error: "organization_id oder user_id fehlt im Event" },
          { status: 400 }
        )
      }
      const success = await coreStore.upsertMembership({
        clerkOrgId: orgId,
        clerkUserId,
        role: "member",
      })
      if (!success) {
        return NextResponse.json(
          { error: "Membership konnte nicht gespeichert werden" },
          { status: 500 }
        )
      }
    } else if (evt.type === "organizationMembership.deleted") {
      const data = evt.data as {
        organization?: { id?: string }
        public_user_data?: { user_id?: string }
      }
      const orgId = data.organization?.id
      const clerkUserId = data.public_user_data?.user_id
      if (!orgId || !clerkUserId) return NextResponse.json({ received: true })
      const success = await coreStore.deleteMembership({
        clerkOrgId: orgId,
        clerkUserId,
      })
      if (!success) {
        return NextResponse.json(
          { error: "Membership konnte nicht entfernt werden" },
          { status: 500 }
        )
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
