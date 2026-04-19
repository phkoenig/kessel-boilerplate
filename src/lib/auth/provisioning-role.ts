import type { CoreStore } from "@/lib/core/types"

/**
 * Prueft ob eine Rollenbezeichnung administrative Rechte signalisiert.
 * Case-insensitive. Akzeptiert `admin`, `superuser`, `super-user`.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  const normalized = (role ?? "").trim().toLowerCase()
  return normalized === "admin" || normalized === "superuser" || normalized === "super-user"
}

export type BoilerplateProvisionedRole = "admin" | "user" | "superuser"

/**
 * Modus der Rollen-Aufloesung:
 *
 * - `"initial"`: Erst-Provisioning (Webhook `user.created`, autoProvisionProfile).
 *   Fuehrt ggf. Bootstrap-Admin-Regel aus (erster User wird Admin).
 * - `"sync"`: Laufende Re-Sync (jeder Login, Webhook `user.updated`, Profil-GET).
 *   Fuehrt **nur** Allowlist-Upgrade aus, niemals Bootstrap-Admin oder stilles
 *   Downgrade.
 *
 * Siehe `docs/03_features/security-auth-hardening.plan.md` H-5/M-12.
 */
export type ProvisioningMode = "initial" | "sync"

/**
 * Parsed die Admin-Allowlist aus `BOILERPLATE_ADMIN_EMAILS`.
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

export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  return getAdminEmailAllowlist().has(normalized)
}

/**
 * Ermittelt die Rolle fuer Provisioning oder Re-Sync.
 *
 * Aufloesungs-Regeln:
 *
 * | Szenario                                      | initial | sync  |
 * |-----------------------------------------------|---------|-------|
 * | Allowlist-Email + kein existing superuser     | admin   | admin |
 * | Allowlist-Email + existing superuser          | superu. | superu|
 * | Existing admin-Rolle                          | admin   | admin |
 * | Existing superuser-Rolle                      | superu. | superu|
 * | Kein Admin im System (Bootstrap)              | admin   | user  |
 * | Sonst                                         | user    | user  |
 *
 * Der `sync`-Modus erzwingt *keinen* Bootstrap-Admin, damit ein existierender
 * User nicht bei jedem Login ploetzlich zum Admin faellt, nur weil der einzige
 * Admin geloescht wurde. Bootstrap-Admin ist eine **initiale** Entscheidung.
 *
 * @see docs/03_features/security-auth-hardening.plan.md H-5
 */
export async function resolveBoilerplateProvisioningRole(
  coreStore: CoreStore,
  existingRole: string | null | undefined,
  email?: string | null,
  options?: { mode?: ProvisioningMode }
): Promise<BoilerplateProvisionedRole> {
  const mode: ProvisioningMode = options?.mode ?? "initial"

  if (isAllowlistedAdminEmail(email)) {
    return existingRole === "superuser" ? "superuser" : "admin"
  }

  if (isAdminRole(existingRole)) {
    return existingRole === "superuser" ? "superuser" : "admin"
  }

  if (mode === "initial") {
    const users = await coreStore.listUsers()
    const hasAdmin = users.some((u) => isAdminRole(u.role))
    if (!hasAdmin) {
      return "admin"
    }
  }

  return "user"
}
