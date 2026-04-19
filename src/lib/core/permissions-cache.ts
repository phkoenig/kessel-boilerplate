/**
 * Serverseitiger Cache fuer `listModulePermissions`.
 *
 * Motivation: Die Rollen-Matrix wird in jeder Seite via `/api/core/permissions`
 * geladen. Ein kleiner TTL-Cache spart Spacetime-Reducer-Roundtrips.
 *
 * WICHTIG: Der Cache MUSS in einem shared lib-Modul liegen (nicht im Route-
 * Handler selbst), weil Next.js App-Router-Routes beim Build potentiell
 * mehrfach instanziiert werden koennen. Wenn Route A eine Variable in Route B
 * schreibt, kann das bei unterschiedlichen Instanzen ins Leere laufen. Ein
 * gemeinsames lib-Modul garantiert eine einzige Cache-Instanz pro Prozess.
 */

import type { CoreModulePermission } from "./types"

/** TTL bewusst kurz (10 s) — Korrektheit schlaegt Latenz-Gain. */
const TTL_MS = 10_000

let cache: { mode: string; permissions: CoreModulePermission[]; expiresAt: number } | null = null

export function getCachedModulePermissions(): {
  mode: string
  permissions: CoreModulePermission[]
} | null {
  if (!cache) return null
  if (cache.expiresAt <= Date.now()) {
    cache = null
    return null
  }
  return { mode: cache.mode, permissions: cache.permissions }
}

export function setCachedModulePermissions(
  mode: string,
  permissions: CoreModulePermission[]
): void {
  cache = { mode, permissions, expiresAt: Date.now() + TTL_MS }
}

/**
 * Invalidiert den Cache. MUSS von allen Routen aufgerufen werden, die
 * `module_permissions` schreiben (z. B. `/api/admin/roles/permissions`),
 * damit die Rollen-Seite nach dem Speichern sofort den frischen Wert sieht.
 */
export function invalidateModulePermissionsCache(): void {
  cache = null
}
