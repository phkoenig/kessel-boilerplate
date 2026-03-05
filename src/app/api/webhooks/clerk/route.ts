/**
 * Clerk Webhook Endpoint
 *
 * Syncs Clerk User Lifecycle Events -> Supabase profiles.
 * Events: user.created, user.updated, user.deleted
 *
 * Signing Secret: CLERK_WEBHOOK_SIGNING_SECRET (Vault)
 */

import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { getAllowedRoleForEmail } from "@/lib/auth/allowed-users"

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

    if (evt.type === "user.created") {
      const data = evt.data as ClerkUserData
      const supabase = createServiceClient()
      const email = getPrimaryEmail(data)
      const mappedRole = getAllowedRoleForEmail(email)
      if (!mappedRole) {
        return NextResponse.json({ received: true, ignored: "email-not-allowlisted" })
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_user_id", data.id)
        .single()

      if (existing) {
        const { error } = await supabase
          .from("profiles")
          .update({
            email: email || "unknown@clerk.local",
            display_name: getDisplayName(data),
            avatar_url: data.image_url ?? data.imageUrl ?? null,
            role: mappedRole,
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_user_id", data.id)
        if (error) {
          return NextResponse.json(
            { error: "Profil-Update fehlgeschlagen", details: error.message },
            { status: 500 }
          )
        }
      } else {
        const { data: role } = await supabase
          .from("roles")
          .select("id")
          .eq("name", mappedRole)
          .single()
        const roleId = role?.id ?? null
        const { error } = await supabase.from("profiles").insert({
          id: crypto.randomUUID(),
          clerk_user_id: data.id,
          email: email || "unknown@clerk.local",
          display_name: getDisplayName(data),
          avatar_url: data.image_url ?? data.imageUrl ?? null,
          role: mappedRole,
          role_id: roleId,
        })
        if (error) {
          return NextResponse.json(
            { error: "Profil konnte nicht angelegt werden", details: error.message },
            { status: 500 }
          )
        }
      }
    } else if (evt.type === "user.updated") {
      const data = evt.data as ClerkUserData
      const supabase = createServiceClient()
      const email = getPrimaryEmail(data)
      const mappedRole = getAllowedRoleForEmail(email)
      if (!mappedRole) {
        await supabase.from("profiles").delete().eq("clerk_user_id", data.id)
        return NextResponse.json({ received: true, ignored: "email-not-allowlisted" })
      }
      const { data: role } = await supabase
        .from("roles")
        .select("id")
        .eq("name", mappedRole)
        .single()

      const { error } = await supabase
        .from("profiles")
        .update({
          email,
          display_name: getDisplayName(data),
          avatar_url: data.image_url ?? data.imageUrl ?? null,
          role: mappedRole,
          role_id: role?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", data.id)

      if (error) {
        return NextResponse.json(
          { error: "Profil konnte nicht aktualisiert werden", details: error.message },
          { status: 500 }
        )
      }
    } else if (evt.type === "user.deleted") {
      const data = evt.data as { id?: string }
      const clerkId = data?.id
      if (!clerkId) {
        return NextResponse.json({ error: "Keine User-ID im Event" }, { status: 400 })
      }
      const supabase = createServiceClient()
      const { error } = await supabase.from("profiles").delete().eq("clerk_user_id", clerkId)
      if (error) {
        return NextResponse.json(
          { error: "Profil konnte nicht geloescht werden", details: error.message },
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
