/**
 * getAuthenticatedUser — Clerk Auth + Boilerplate-Core-Profil
 *
 * Einzige zentrale Auth-Quelle im Boilerplate-Kern: Clerk fuer Identity,
 * Spacetime-Core fuer Profil-Attribute (Role, Tenant, Display-Name).
 * Die Funktion kennt explizit kein Supabase — siehe Plan G5
 * (`docs/12_plans/260419-boilerplate-db-agnostik.md`).
 *
 * @returns {@link AuthenticatedUser} oder `null` wenn nicht eingeloggt / kein Profil
 */

import { auth, clerkClient } from "@clerk/nextjs/server"
import type { NextResponse } from "next/server"
import { resolveBoilerplateProvisioningRole, isAdminRole } from "@/lib/auth/provisioning-role"
import { getCoreStore } from "@/lib/core"

export interface AuthenticatedUser {
  /** Clerk User ID (`user_xxx`) */
  clerkUserId: string
  /** Profil-UUID im Core */
  profileId: string
  /** Rollen-Name (`admin`, `user`, `superuser`) */
  role: string
  /** Schnell-Check fuer Admin-Routen */
  isAdmin: boolean
  /** Single-Tenant: immer `null` */
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

const UNKNOWN_EMAIL_PLACEHOLDER = "unknown@clerk.local"

/**
 * Extrahiert eine Email aus Clerk Session Claims. Robust gegen verschiedene
 * Namen, die via JWT-Templates gesetzt sein koennen.
 */
function getEmailFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== "object") return null
  const r = claims as Record<string, unknown>
  const candidates = [
    r.email,
    r.primary_email,
    r.primary_email_address,
    r.emailAddress,
    r.email_address,
    r.preferred_username,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.includes("@")) {
      return candidate
    }
  }
  return null
}

/**
 * Laedt die Email direkt aus der Clerk Backend API.
 * Fallback, wenn der Session-Claim keinen `email`-Eintrag enthaelt.
 */
async function fetchEmailFromClerk(clerkUserId: string): Promise<{
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}> {
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      email?.split("@")[0] ||
      null
    return { email, displayName, avatarUrl: clerkUser.imageUrl ?? null }
  } catch {
    return { email: null, displayName: null, avatarUrl: null }
  }
}

async function autoProvisionProfile(
  clerkUserId: string,
  sessionClaims: unknown,
  tenantId: string | null
) {
  const claimEmail = getEmailFromClaims(sessionClaims)
  const clerkData = await fetchEmailFromClerk(clerkUserId)

  const email = clerkData.email ?? claimEmail ?? UNKNOWN_EMAIL_PLACEHOLDER
  const displayName = clerkData.displayName ?? email.split("@")[0] ?? "User"
  const avatarUrl = clerkData.avatarUrl

  const coreStore = getCoreStore()
  const mappedRole = await resolveBoilerplateProvisioningRole(coreStore, null, email, {
    mode: "initial",
  })

  return coreStore.upsertUserFromClerk({
    clerkUserId,
    email,
    displayName,
    avatarUrl,
    role: mappedRole,
    tenantId,
  })
}

/**
 * Repariert ein Profil mit `unknown@clerk.local`-Email, falls Clerk jetzt
 * die richtige Adresse liefert. Idempotent, schreibt nur bei Aenderung.
 */
async function repairUnknownEmail(
  clerkUserId: string,
  profile: Awaited<ReturnType<ReturnType<typeof getCoreStore>["getUserByClerkId"]>>
) {
  if (!profile) return profile
  if (profile.email && profile.email !== UNKNOWN_EMAIL_PLACEHOLDER) return profile

  const clerkData = await fetchEmailFromClerk(clerkUserId)
  if (!clerkData.email) return profile

  const coreStore = getCoreStore()
  const updated = await coreStore.upsertUserFromClerk({
    clerkUserId,
    email: clerkData.email,
    displayName: profile.displayName ?? clerkData.displayName ?? clerkData.email.split("@")[0],
    avatarUrl: profile.avatarUrl ?? clerkData.avatarUrl,
    role: profile.role,
    tenantId: profile.tenantId ?? null,
  })
  return updated ?? profile
}

/**
 * Holt den eingeloggten User mit Profil aus dem Core-Store.
 * Gibt `null` zurueck wenn nicht eingeloggt oder Profil nicht provisionierbar.
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
  } else {
    profile = (await repairUnknownEmail(userId, profile)) ?? profile
  }

  const resolvedRole = await resolveBoilerplateProvisioningRole(
    coreStore,
    profile.role,
    profile.email,
    { mode: "sync" }
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
