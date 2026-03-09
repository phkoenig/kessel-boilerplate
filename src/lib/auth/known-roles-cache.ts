import { getCoreStore } from "@/lib/core"

const KNOWN_ROLES_CACHE_TTL_MS = 60_000
let knownRolesCache: { roles: string[]; expiresAt: number } | null = null

/**
 * Liefert die bekannten Rollen aller User aus dem Core-Store.
 * Ergebnis wird 60 Sekunden im Speicher gecacht, um wiederholte
 * `listUsers()`-Aufrufe in Auth-Guards und Profile-Routes zu vermeiden.
 */
export async function getKnownRoles(): Promise<string[]> {
  if (knownRolesCache && knownRolesCache.expiresAt > Date.now()) {
    return knownRolesCache.roles
  }

  const roles = (await getCoreStore().listUsers()).map((entry) => entry.role)
  knownRolesCache = { roles, expiresAt: Date.now() + KNOWN_ROLES_CACHE_TTL_MS }
  return roles
}
