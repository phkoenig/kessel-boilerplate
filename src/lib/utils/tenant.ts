/**
 * Tenant Utilities
 * ================
 * Helper-Funktionen für Tenant-Isolation
 */

/**
 * Liest tenant_slug aus Environment-Variable.
 * Wird von der CLI gesetzt und für Storage-Pfade verwendet.
 */
export function getTenantSlug(): string | null {
  return process.env.NEXT_PUBLIC_TENANT_SLUG || null
}

/**
 * Generiert einen Storage-Pfad mit Tenant-Präfix.
 * Falls kein tenant_slug gesetzt ist, wird kein Präfix verwendet.
 */
export function getTenantStoragePath(path: string): string {
  const tenantSlug = getTenantSlug()
  if (!tenantSlug || tenantSlug === "public") {
    return path
  }
  return `${tenantSlug}/${path}`
}
