import { getCoreStore } from "@/lib/core"
import type { CoreAppSettings, CoreWikiDocument } from "./types"

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const APP_SETTINGS_TTL_MS = 120_000
const WIKI_DOCUMENT_TTL_MS = 300_000

const appSettingsCache = new Map<string, CacheEntry<CoreAppSettings | null>>()
const wikiDocumentCache = new Map<string, CacheEntry<CoreWikiDocument | null>>()

/**
 * Gecachter Zugriff auf App-Settings.
 * TTL: 2 Minuten. Wird von Layout, App-Settings-API und Icon-Generator genutzt.
 */
export async function getCachedAppSettings(tenantSlug: string): Promise<CoreAppSettings | null> {
  const cached = appSettingsCache.get(tenantSlug)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const data = await getCoreStore().getAppSettings(tenantSlug)
  appSettingsCache.set(tenantSlug, { data, expiresAt: Date.now() + APP_SETTINGS_TTL_MS })
  return data
}

/**
 * Invalidiert den App-Settings-Cache für einen Tenant.
 * Aufrufen nach upsertAppSettings.
 */
export function invalidateAppSettingsCache(tenantSlug: string): void {
  appSettingsCache.delete(tenantSlug)
}

/**
 * Gecachter Zugriff auf Wiki-Dokumente.
 * TTL: 5 Minuten. Wiki-Content ändert sich selten.
 */
export async function getCachedWikiDocument(slug: string): Promise<CoreWikiDocument | null> {
  const cached = wikiDocumentCache.get(slug)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const data = await getCoreStore().getWikiDocument(slug)
  wikiDocumentCache.set(slug, { data, expiresAt: Date.now() + WIKI_DOCUMENT_TTL_MS })
  return data
}

/**
 * Invalidiert den Wiki-Document-Cache für einen Slug.
 */
export function invalidateWikiDocumentCache(slug: string): void {
  wikiDocumentCache.delete(slug)
}
