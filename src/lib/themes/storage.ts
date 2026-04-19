/**
 * Theme Storage Service
 * =====================
 * Verwaltet Theme-CSS ueber den Blob-Proxy und Theme-Metadaten ueber Core-APIs.
 *
 * Architektur:
 * - Theme-Metadaten: Boilerplate-Core (Spacetime)
 * - Theme-CSS:       {@link getBlobStorage} via `/api/blob/theme_css/<key>`
 * - Lokale Themes:   Fallback aus `src/themes/` (builtin)
 */

import { getTenantStoragePath } from "@/lib/utils/tenant"
import type { ThemeColorScheme, ThemeSnapshot } from "@/lib/themes/types"

/**
 * Theme-Metadaten aus der Datenbank.
 */
export interface ThemeRecord {
  id: string
  name: string
  description: string | null
  dynamic_fonts: string[]
  is_builtin: boolean
  created_at: string
  updated_at: string
}

/**
 * Theme-Daten für Import/Export.
 */
export interface ThemeData {
  id: string
  name: string
  description?: string
  dynamicFonts?: string[]
  lightCSS: string
  darkCSS: string
}

const parseThemeResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T
  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`)
  }

  return payload
}

export async function fetchThemes(): Promise<ThemeRecord[]> {
  try {
    const response = await fetch("/api/themes/list", { cache: "no-store" })
    const data = await parseThemeResponse<{
      themes?: Array<{
        id: string
        name: string
        description: string
        dynamicFonts?: string[]
        isBuiltin: boolean
      }>
    }>(response)

    return (data.themes ?? []).map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description || null,
      dynamic_fonts: theme.dynamicFonts ?? [],
      is_builtin: theme.isBuiltin,
      created_at: "",
      updated_at: "",
    }))
  } catch (error) {
    console.error("Fehler beim Laden der Themes:", error)
    return []
  }
}

/**
 * Lädt ein einzelnes Theme aus der Datenbank.
 */
export async function fetchTheme(themeId: string): Promise<ThemeRecord | null> {
  const themes = await fetchThemes()
  return themes.find((theme) => theme.id === themeId) ?? null
}

/**
 * Lädt das CSS für ein Theme aus dem Storage.
 * Gibt null zurück, wenn das Theme nicht existiert (Fallback auf lokale Datei).
 *
 * Multi-Tenant: Themes liegen im tenant-spezifischen Ordner.
 * Bei Tenant-Erstellung wird automatisch ein Default-Theme kopiert.
 */
export async function fetchThemeCSS(themeId: string): Promise<string | null> {
  try {
    const response = await fetch(getThemeCSSUrl(themeId), {
      cache: "no-store",
      credentials: "same-origin",
    })
    if (!response.ok) {
      return null
    }
    return await response.text()
  } catch {
    return null
  }
}

/**
 * Speichert ein Theme in Supabase (Metadaten + CSS).
 */
export async function saveTheme(theme: ThemeData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/themes/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId: theme.id,
        name: theme.name,
        description: theme.description ?? "Importiertes Theme",
        dynamicFonts: theme.dynamicFonts ?? [],
        lightCSS: theme.lightCSS,
        darkCSS: theme.darkCSS,
      }),
    })
    await parseThemeResponse(response)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Metadaten-Speicherung fehlgeschlagen",
    }
  }
}

/**
 * Aktualisiert Theme-Metadaten und/oder CSS.
 * Builtin-Themes ("default") können nicht überschrieben werden.
 */
export async function updateTheme(
  themeId: string,
  updates: {
    name?: string
    description?: string
    dynamicFonts?: string[]
    lightCSS?: string
    darkCSS?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/themes/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId,
        name: updates.name,
        description: updates.description,
        dynamicFonts: updates.dynamicFonts,
        lightCSS: updates.lightCSS,
        darkCSS: updates.darkCSS,
      }),
    })
    await parseThemeResponse(response)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Metadaten-Update fehlgeschlagen",
    }
  }
}

/**
 * Löscht ein Theme aus Supabase (Metadaten + CSS).
 */
export async function deleteTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/themes/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId }),
    })
    await parseThemeResponse(response)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Löschen fehlgeschlagen",
    }
  }
}

/**
 * Prüft, ob ein Theme mit der ID bereits existiert.
 */
export async function themeExists(themeId: string): Promise<boolean> {
  const theme = await fetchTheme(themeId)
  return theme !== null
}

/**
 * Generiert die URL fuer das Theme-CSS.
 *
 * Multi-Tenant: Themes liegen im tenant-spezifischen Key. Der Pfad wird ueber
 * den internen Blob-Proxy (`/api/blob/theme_css/<key>`) ausgeliefert, damit
 * das gewaehlte Storage-Backend (Spacetime default, Supabase optional) fuer
 * Konsumenten unsichtbar bleibt.
 */
export function getThemeCSSUrl(themeId: string): string {
  const storagePath = getTenantStoragePath(`${themeId}.css`)
  const encoded = storagePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `/api/blob/theme_css/${encoded}`
}

/**
 * Lädt alle dynamischen Theme-CSS-URLs.
 * Wird verwendet, um CSS-Links im Head zu generieren.
 */
export async function fetchDynamicThemeCSSUrls(): Promise<Array<{ id: string; url: string }>> {
  const themes = await fetchThemes()
  return themes
    .filter((theme) => !theme.is_builtin)
    .map((theme) => ({
      id: theme.id,
      url: getThemeCSSUrl(theme.id),
    }))
}

// ============================================================================
// Neues Theme-System (aus iryse portiert)
// ============================================================================

let themeSnapshotCache: ThemeSnapshot | null = null
let themeSnapshotPromise: Promise<ThemeSnapshot> | null = null

/**
 * Laedt den vom Server berechneten Theme-Snapshot (GET /api/user/theme).
 *
 * Deduplicated und cacht das Ergebnis fuer den aktuellen Page-Load. `forceRefresh=true`
 * umgeht den Cache und laedt neu (nach Save/Import).
 */
export async function fetchThemeSnapshot(
  options: { forceRefresh?: boolean } = {}
): Promise<ThemeSnapshot> {
  if (!options.forceRefresh && themeSnapshotCache) {
    return themeSnapshotCache
  }

  if (!options.forceRefresh && themeSnapshotPromise) {
    return themeSnapshotPromise
  }

  const request = (async (): Promise<ThemeSnapshot> => {
    const response = await fetch("/api/user/theme", {
      cache: "no-store",
      credentials: "same-origin",
    })

    if (!response.ok) {
      throw new Error("Theme-Snapshot konnte nicht geladen werden.")
    }

    const snapshot = (await response.json()) as ThemeSnapshot
    themeSnapshotCache = snapshot
    return snapshot
  })().finally(() => {
    themeSnapshotPromise = null
  })

  themeSnapshotPromise = request
  return request
}

/**
 * Admin-Operation: Setzt App-weites Theme und/oder Color-Scheme (PUT /api/user/theme).
 *
 * Server synchronisiert auf alle Admin-Profile und broadcastet via Realtime.
 * Liefert den aktualisierten Snapshot zurueck.
 */
export async function updateEffectiveThemeSelection(updates: {
  theme?: string
  colorScheme?: ThemeColorScheme
  themeScope?: "global" | "per_user"
}): Promise<{ success: boolean; snapshot?: ThemeSnapshot; error?: string }> {
  try {
    const res = await fetch("/api/user/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const data = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      const msg =
        typeof data.error === "string" && data.error.length > 0
          ? data.error
          : "Fehler beim Aktualisieren des Themes"
      return { success: false, error: msg }
    }

    // API liefert { success: true, ...ThemeSnapshot } — Metadaten nicht im Snapshot cachen.
    const snapshot = { ...data } as Record<string, unknown>
    delete snapshot.success
    delete snapshot.error
    themeSnapshotCache = snapshot as unknown as ThemeSnapshot
    return { success: true, snapshot: snapshot as unknown as ThemeSnapshot }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unbekannter Fehler",
    }
  }
}

/**
 * Invalidiert den Snapshot-Cache (nach Save/Import/Delete).
 */
export function invalidateThemeSnapshotCache(): void {
  themeSnapshotCache = null
  themeSnapshotPromise = null
}
