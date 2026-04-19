/**
 * getAuthenticatedUser — Clerk Auth + Boilerplate-Core-Profil
 *
 * Kombiniert Clerk Auth mit Profil-Lookup im Spacetime-Core.
 * Verwende in API Routes statt `supabase.auth.getUser()`.
 *
 * @returns {@link AuthenticatedUser} oder `null` wenn nicht eingeloggt / kein Profil
 */

import { auth, clerkClient } from "@clerk/nextjs/server"
import type { NextResponse } from "next/server"
import { resolveBoilerplateProvisioningRole, isAdminRole } from "@/lib/auth/provisioning-role"
import { getCoreStore } from "@/lib/core"

export interface AuthenticatedUser {
  /** Clerk User ID (`user_xxx`) — fuer Anzeige/API-Responses */
  clerkUserId: string
  /** Profil-UUID im Core — fuer tenant_id, FKs */
  profileId: string
  /** Rollen-Name (`admin`, `user`, `superuser`) */
  role: string
  /** Schnell-Check fuer Admin-Routen */
  isAdmin: boolean
  /** Single-Tenant: immer `null` (keine Clerk Organizations im Boilerplate) */
  activeOrgId: null
  /** Tenant aus Core-Profil */
  tenantId: string | null
  /** Vollstaendiges Profil (snake_case fuer Legacy-API-Kompatibilitaet) */
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

  const coreStore = getCoreStore()
  const effectiveEmail = email || "unknown@clerk.local"
  const mappedRole = await resolveBoilerplateProvisioningRole(coreStore, null, effectiveEmail)

  return coreStore.upsertUserFromClerk({
    clerkUserId,
    email: effectiveEmail,
    displayName,
    avatarUrl,
    role: mappedRole,
    tenantId,
  })
}

/**
 * Holt den eingeloggten User mit Profil aus dem Core-Store.
 * Gibt `null` zurueck wenn nicht eingeloggt oder Profil nicht provisionierbar ist.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const coreStore = getCoreStore()

  let profile = await coreStore.getUserByClerkId(userId)

  if (!profile) {
    const provisioned = await autoProvisionProfile(userId, sessionClaims, null)
    if (!provisioned) return null
    profile = provisioned
  }

  const resolvedRole = await resolveBoilerplateProvisioningRole(
    coreStore,
    profile.role,
    profile.email
  )
  if (resolvedRole && resolvedRole !== profile.role) {
    const reprovisioned = await coreStore.upsertUserFromClerk({
      clerkUserId: userId,
      email: profile.email,
      displayName: profile.displayName ?? profile.email.split("@")[0] ?? "User",
      avatarUrl: profile.avatarUrl ?? null,
      role: resolvedRole,
      tenantId: profile.tenantId ?? null,
    })
    if (reprovisioned) {
      profile = reprovisioned
    }
  }

  const role = profile.role ?? "user"
  const isAdmin = isAdminRole(role)
  const tenantId = profile.tenantId ?? null

  return {
    clerkUserId: userId,
    profileId: profile.id,
    role,
    isAdmin,
    activeOrgId: null,
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

/**
 * Wie {@link getAuthenticatedUser}, aber wirft 401 Response wenn nicht eingeloggt.
 */
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser()
  if (!user) {
    const { NextResponse } = await import("next/server")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse
  }
  return user
}
