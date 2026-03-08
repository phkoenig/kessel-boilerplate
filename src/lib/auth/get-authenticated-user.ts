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
import type { NextResponse } from "next/server"
import {
  getAllowedRoleForEmail,
  isAdminRole,
  isAllowedEmail,
  resolveProvisioningRole,
} from "@/lib/auth/allowed-users"
import { getCoreStore } from "@/lib/core"

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

  const coreStore = getCoreStore()

  let tenantId: string | null = null
  if (orgId) {
    tenantId = await coreStore.getTenantIdByClerkOrgId(orgId)
  }

  let profile = await coreStore.getUserByClerkId(userId)

  if (!profile) {
    const provisioned = await autoProvisionProfile(userId, sessionClaims, tenantId)
    if (!provisioned) return null
    profile = provisioned
  }

  const knownRoles = (await coreStore.listUsers()).map((entry) => entry.role)
  const resolvedRole = resolveProvisioningRole(profile.email, profile.role, knownRoles)
  if (resolvedRole && resolvedRole !== profile.role) {
    const reprovisioned = await coreStore.upsertUserFromClerk({
      clerkUserId: userId,
      email: profile.email,
      displayName: profile.displayName ?? profile.email.split("@")[0] ?? "User",
      avatarUrl: profile.avatarUrl ?? null,
      role: resolvedRole,
      tenantId: tenantId ?? profile.tenantId ?? null,
    })
    if (reprovisioned) {
      profile = reprovisioned
    }
  }

  const email = profile.email ?? ""
  if (!isAllowedEmail(email)) return null

  const role = profile.role ?? "user"
  const isAdmin = isAdminRole(role)

  if (!tenantId && profile.tenantId) {
    tenantId = profile.tenantId
  }

  return {
    clerkUserId: userId,
    profileId: profile.id,
    role,
    isAdmin,
    activeOrgId: orgId ?? null,
    tenantId,
    profile: {
      id: profile.id,
      clerk_user_id: profile.clerkUserId,
      email: profile.email,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      role,
      role_id: profile.roleId,
      tenant_id: profile.tenantId,
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
  tenantId: string | null
) {
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

  return getCoreStore().upsertUserFromClerk({
    clerkUserId,
    email: email || "unknown@clerk.local",
    displayName,
    avatarUrl,
    role: mappedRole,
    tenantId,
  })
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
