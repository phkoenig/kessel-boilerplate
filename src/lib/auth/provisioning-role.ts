import type { CoreStore } from "@/lib/core/types"

/**
 * Prueft ob eine Rollenbezeichnung administrative Rechte signalisiert.
 *
 * @param role - Roher Rollen-String aus Core oder Session.
 * @returns `true`, wenn Admin oder Superuser.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = (role ?? "").trim().toLowerCase()
  return normalized === "admin" || normalized === "superuser" || normalized === "super-user"
}

export type BoilerplateProvisionedRole = "admin" | "user" | "superuser"

/**
 * Parsed die Admin-Allowlist aus `BOILERPLATE_ADMIN_EMAILS` (kommagetrennt,
 * Whitespace-tolerant, Case-insensitive).
 *
 * @returns Set normalisierter (lowercase, getrimmter) E-Mail-Adressen.
 */
export function getAdminEmailAllowlist(): ReadonlySet<string> {
  const raw = process.env.BOILERPLATE_ADMIN_EMAILS
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0)
  )
}

/**
 * Prueft ob eine E-Mail in der Admin-Allowlist steht.
 */
export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  return getAdminEmailAllowlist().has(normalized)
}

/**
 * Ermittelt die Rolle fuer Provisioning oder Re-Sync im Single-Tenant-Boilerplate.
 *
 * Regeln (Reihenfolge ist wichtig):
 * 1. Steht die E-Mail in `BOILERPLATE_ADMIN_EMAILS`, wird der User immer `admin`.
 * 2. Bestehende `admin`/`superuser`-Rollen werden nicht stillschweigend downgraded.
 * 3. Wenn noch kein Admin existiert, wird der naechste User `admin` (Bootstrap).
 * 4. Sonst Standard `user`.
 *
 * @param coreStore - Aktiver {@link CoreStore}.
 * @param existingRole - Bereits persistierte Rolle oder `null/undefined` bei Erstanlage.
 * @param email - E-Mail des Users (fuer Allowlist-Check). Optional fuer Abwaertskompatibilitaet.
 * @returns Die zu setzende Rolle.
 */
export async function resolveBoilerplateProvisioningRole(
  coreStore: CoreStore,
  existingRole: string | null | undefined,
  email?: string | null
): Promise<BoilerplateProvisionedRole> {
  if (isAllowlistedAdminEmail(email)) {
    return existingRole === "superuser" ? "superuser" : "admin"
  }

  if (isAdminRole(existingRole)) {
    return existingRole === "superuser" ? "superuser" : "admin"
  }

  const users = await coreStore.listUsers()
  const hasAdmin = users.some((u) => isAdminRole(u.role))
  if (!hasAdmin) {
    return "admin"
  }
  return "user"
}
