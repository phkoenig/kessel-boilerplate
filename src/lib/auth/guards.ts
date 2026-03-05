/**
 * API-Route Auth-Guards
 *
 * Zentralisierte Guards fuer requireAuth, requireRole, requireOrganization.
 * Verwende in API-Routen statt verstreuter manueller Checks.
 */

import type { NextResponse } from "next/server"
import { getAuthenticatedUser, requireAuth, type AuthenticatedUser } from "./get-authenticated-user"

/** Admin-Rollen (superuser und super-user fuer Rueckwaertskompatibilitaet) */
const ADMIN_ROLES = ["admin", "superuser", "super-user"]

/**
 * Prueft Auth. Gibt User oder 401 zurueck.
 * Nutzung: const userOrErr = await requireAuth(); if (userOrErr instanceof Response) return userOrErr
 */
export { requireAuth }

/**
 * Prueft Auth und Admin-Rolle.
 * Gibt User oder 401/403 zurueck.
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<AuthenticatedUser | NextResponse> {
  const userOrErr = await requireAuth()
  if (userOrErr instanceof Response) return userOrErr
  if (allowedRoles.includes(userOrErr.role)) return userOrErr
  const { NextResponse } = await import("next/server")
  return NextResponse.json({ error: "Forbidden" }, { status: 403 }) as NextResponse
}

/**
 * Prueft Admin (admin, superuser, super-user).
 */
export async function requireAdmin(): Promise<AuthenticatedUser | NextResponse> {
  return requireRole(ADMIN_ROLES)
}

/**
 * requireOrganization - Stub fuer Phase 2/3.
 * Aktuell: Prueft nur Auth, Org-Check folgt mit Clerk Organizations.
 */
export async function requireOrganization(
  _orgId?: string
): Promise<AuthenticatedUser | NextResponse> {
  return requireAuth()
}
