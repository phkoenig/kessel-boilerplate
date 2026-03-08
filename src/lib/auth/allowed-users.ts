/**
 * E-Mail-Allowlist fuer Clerk-Auth (optional).
 *
 * Standard: Alle E-Mails erlaubt (Boilerplate-Modus).
 * Projekte koennen ALLOWED_EMAILS_ENABLED=true setzen und
 * eigene Mapping-Logik in getAllowedRoleForEmail implementieren.
 */

export type AllowedUserRole = "admin" | "user" | "superuser"

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase()
}

export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = (role ?? "").trim().toLowerCase()
  return normalized === "admin" || normalized === "superuser" || normalized === "super-user"
}

/**
 * Gibt die Rolle fuer eine E-Mail zurueck.
 * Standard: Immer "user" (alle erlaubt).
 * Projekte koennen ueberschreiben fuer restriktive Allowlists.
 */
export function getAllowedRoleForEmail(email: string | null | undefined): AllowedUserRole | null {
  const normalized = normalizeEmail(email)
  if (!normalized) return null

  if (normalized === "admin@local") {
    return "admin"
  }

  if (normalized === "user@local") {
    return "user"
  }

  // Boilerplate: Alle E-Mails erlaubt, Standard-Rolle "user"
  return "user"
}

/**
 * Leitet die effektive Rolle fuer Boilerplate-Default-Setups ab.
 *
 * Regeln:
 * - bestehende Admin-Rollen werden nie stillschweigend downgraded
 * - `admin@local` bleibt Admin, `user@local` bleibt User
 * - wenn aktuell gar kein Admin existiert, wird der erste echte User wieder
 *   zum Admin hochgezogen, damit die Admin-Flaechen nicht verloren gehen
 */
export function resolveProvisioningRole(
  email: string | null | undefined,
  existingRole: string | null | undefined,
  knownRoles: readonly string[]
): AllowedUserRole | null {
  if (isAdminRole(existingRole)) {
    return existingRole === "superuser" ? "superuser" : "admin"
  }

  const mappedRole = getAllowedRoleForEmail(email)
  if (!mappedRole) {
    return null
  }

  const normalizedEmail = normalizeEmail(email)
  if (mappedRole !== "user") {
    return mappedRole
  }

  if (normalizedEmail === "user@local") {
    return "user"
  }

  const hasAdmin = knownRoles.some((role) => isAdminRole(role))
  if (!hasAdmin) {
    return "admin"
  }

  return mappedRole
}

/**
 * Prueft ob eine E-Mail erlaubt ist.
 * Standard: Immer true (alle erlaubt).
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  return getAllowedRoleForEmail(email) !== null
}
