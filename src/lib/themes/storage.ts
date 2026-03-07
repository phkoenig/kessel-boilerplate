/**
 * Theme Storage Service
 * =====================
 * Verwaltet Theme-CSS im Storage und Theme-Metadaten ueber Core-APIs.
 *
 * Architektur:
 * - Theme-Metadaten: Boilerplate-Core (Spacetime / Legacy-Adapter)
 * - Theme-CSS: Supabase Storage `themes` Bucket
 * - Lokale Themes: Fallback aus `src/themes/` (builtin)
 */

import { createClient } from "@/utils/supabase/client"
import { getTenantStoragePath } from "@/lib/utils/tenant"

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
  const supabase = createClient()
  const storagePath = getTenantStoragePath(`${themeId}.css`)

  const { data, error } = await supabase.storage.from("themes").download(storagePath)

  if (error) {
    // Kein Fehler loggen - Theme könnte builtin sein
    return null
  }

  return await data.text()
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
 * Generiert die URL für das Theme-CSS im Storage.
 *
 * Multi-Tenant: Themes liegen im tenant-spezifischen Ordner.
 */
export function getThemeCSSUrl(themeId: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const storagePath = getTenantStoragePath(`${themeId}.css`)
  return `${supabaseUrl}/storage/v1/object/public/themes/${storagePath}`
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
