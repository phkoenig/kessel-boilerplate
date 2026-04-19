/**
 * API-Route Auth-Guards
 *
 * Zentralisierte Guards fuer requireAuth, requireRole, requireOrganization.
 * Verwende in API-Routen statt verstreuter manueller Checks.
 */

import type { NextResponse } from "next/server"
import { requireAuth, type AuthenticatedUser } from "./get-authenticated-user"

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
 * Prueft Auth; optionaler `orgId`-Parameter ist im Single-Tenant-Boilerplate nicht unterstuetzt.
 *
 * @param orgId - Wenn gesetzt: HTTP 400 (keine Clerk Organizations im Boilerplate).
 */
export async function requireOrganization(
  orgId?: string
): Promise<AuthenticatedUser | NextResponse> {
  const userOrErr = await requireAuth()
  if (userOrErr instanceof Response) return userOrErr

  if (orgId) {
    const { NextResponse } = await import("next/server")
    return NextResponse.json(
      { error: "Organization-basierter Zugriff ist im Single-Tenant-Boilerplate deaktiviert." },
      { status: 400 }
    ) as NextResponse
  }

  return userOrErr
}
