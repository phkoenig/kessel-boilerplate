/**
 * getAuthenticatedUser - Clerk Auth + Supabase Profile
 *
 * Kombiniert Clerk Auth mit Supabase Profil-Lookup.
 * Verwende in API Routes statt supabase.auth.getUser().
 *
 * @returns AuthenticatedUser oder null wenn nicht eingeloggt
 */

import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { randomUUID } from "crypto"
import type { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { getAllowedRoleForEmail, isAllowedEmail } from "@/lib/auth/allowed-users"

const PROFILE_SELECT = `
  id,
  clerk_user_id,
  email,
  display_name,
  avatar_url,
  role,
  role_id,
  tenant_id
`

export interface AuthenticatedUser {
  /** Clerk User ID (user_xxx) - fuer Anzeige/API-Responses */
  clerkUserId: string
  /** profiles.id (UUID) - fuer DB-Queries, tenant_id, FKs */
  profileId: string
  /** Rollen-Name (admin, user, superuser) */
  role: string
  /** Schnell-Check fuer Admin-Routen */
  isAdmin: boolean
  /** Aktive Clerk Organization ID (wenn im Org-Kontext) */
  activeOrgId: string | null
  /** Aufgeloester tenant_id aus app.tenants (clerk_org_id) */
  tenantId: string | null
  /** Vollstaendiges Profil aus DB (optional, bei Bedarf) */
  profile: {
    id: string
    clerk_user_id: string | null
    email: string
    display_name: string | null
    avatar_url: string | null
    role: string
    role_id: string | null
    tenant_id: string | null
  }
}

/**
 * Holt den eingeloggten User mit Profil aus Supabase.
 * Gibt null zurueck wenn nicht eingeloggt.
 *
 * Bei neuem Clerk-User ohne Profil: Auto-Provisioning via Webhook oder on-demand.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { userId, sessionClaims, orgId } = await auth()
  if (!userId) return null

  const supabase = createServiceClient()

  // Tenant aus Clerk Org aufloesen (app.tenants.clerk_org_id)
  // Fallback: profile.tenant_id wenn kein Org-Kontext
  let tenantId: string | null = null
  if (orgId) {
    const { data: tenant } = await supabase
      .schema("app")
      .from("tenants")
      .select("id")
      .eq("clerk_org_id", orgId)
      .single()
    tenantId = tenant?.id ?? null
  }
  const { data: initialProfile, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("clerk_user_id", userId)
    .single()
  let profile: Record<string, unknown> | null = (initialProfile as Record<string, unknown>) ?? null

  if (error && error.code !== "PGRST116") {
    return null
  }

  if (!profile) {
    const provisioned = await autoProvisionProfile(userId, sessionClaims, supabase)
    if (!provisioned) return null
    profile = provisioned
  }

  const email = (profile.email as string) ?? ""
  if (!isAllowedEmail(email)) return null

  const role = (profile.role as string) ?? "user"
  const isAdmin = role === "admin" || role === "superuser" || role === "super-user"

  // Fallback: profile.tenant_id wenn kein Org-Kontext (z.B. Personal/legacy)
  if (!tenantId && profile.tenant_id) {
    tenantId = profile.tenant_id as string
  }

  return {
    clerkUserId: userId,
    profileId: profile.id as string,
    role,
    isAdmin,
    activeOrgId: orgId ?? null,
    tenantId,
    profile: {
      id: profile.id as string,
      clerk_user_id: profile.clerk_user_id as string | null,
      email: (profile.email as string) ?? "",
      display_name: profile.display_name as string | null,
      avatar_url: profile.avatar_url as string | null,
      role,
      role_id: profile.role_id as string | null,
      tenant_id: profile.tenant_id as string | null,
    },
  }
}

function getEmailFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null
  const r = claims as Record<string, unknown>
  if (typeof r.email === "string" && r.email.length > 0) return r.email
  if (typeof r.primary_email === "string" && r.primary_email.length > 0) return r.primary_email
  return null
}

async function autoProvisionProfile(
  clerkUserId: string,
  sessionClaims: unknown,
  supabase: ReturnType<typeof createServiceClient>
): Promise<Record<string, unknown> | null> {
  let email = getEmailFromClaims(sessionClaims) ?? ""
  let displayName = email.split("@")[0] || "User"
  let avatarUrl: string | null = null

  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      email
    displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "User"
    avatarUrl = clerkUser.imageUrl ?? null
  } catch {
    // Clerk-Server nicht verfuegbar - mit Claims weitermachen
  }

  const mappedRole = getAllowedRoleForEmail(email)
  if (!mappedRole) return null

  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", mappedRole)
    .single()

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: randomUUID(),
        clerk_user_id: clerkUserId,
        email: email || "unknown@clerk.local",
        display_name: displayName,
        avatar_url: avatarUrl,
        role: mappedRole,
        role_id: roleRow?.id ?? null,
        can_select_theme: true,
        color_scheme: "system",
      },
      { onConflict: "clerk_user_id" }
    )
    .select(PROFILE_SELECT)
    .single()

  if (error) return null
  return data as Record<string, unknown>
}

/**
 * Wie getAuthenticatedUser, aber wirft 401 Response wenn nicht eingeloggt.
 */
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser()
  if (!user) {
    const { NextResponse } = await import("next/server")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse
  }
  return user
}
