/**
 * E-Mail-Allowlist fuer Clerk-Auth (optional).
 *
 * Standard: Alle E-Mails erlaubt (Boilerplate-Modus).
 * Projekte koennen ALLOWED_EMAILS_ENABLED=true setzen und
 * eigene Mapping-Logik in getAllowedRoleForEmail implementieren.
 */

export type AllowedUserRole = "admin" | "user" | "superuser"

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase()
}

/**
 * Gibt die Rolle fuer eine E-Mail zurueck.
 * Standard: Immer "user" (alle erlaubt).
 * Projekte koennen ueberschreiben fuer restriktive Allowlists.
 */
export function getAllowedRoleForEmail(email: string | null | undefined): AllowedUserRole | null {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  // Boilerplate: Alle E-Mails erlaubt, Standard-Rolle "user"
  return "user"
}

/**
 * Prueft ob eine E-Mail erlaubt ist.
 * Standard: Immer true (alle erlaubt).
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  return getAllowedRoleForEmail(email) !== null
}
