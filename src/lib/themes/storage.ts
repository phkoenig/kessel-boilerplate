/**
 * Theme Storage Service
 * =====================
 * Verwaltet Themes in Supabase Storage und Datenbank.
 *
 * Architektur:
 * - Theme-Metadaten: Supabase `themes` Tabelle
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

/**
 * Lädt alle Theme-Metadaten aus der Datenbank.
 */
export async function fetchThemes(): Promise<ThemeRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .order("is_builtin", { ascending: false })
    .order("name")

  if (error) {
    console.error("Fehler beim Laden der Themes:", error)
    return []
  }

  return data ?? []
}

/**
 * Lädt ein einzelnes Theme aus der Datenbank.
 */
export async function fetchTheme(themeId: string): Promise<ThemeRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("themes").select("*").eq("id", themeId).single()

  if (error) {
    console.error(`Fehler beim Laden des Themes ${themeId}:`, error)
    return null
  }

  return data
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
  const supabase = createClient()

  // 1. CSS in Storage speichern (Multi-Tenant: tenant-spezifischer Ordner)
  const storagePath = getTenantStoragePath(`${theme.id}.css`)
  const cssContent = `/* Theme: ${theme.name} */\n\n/* Light Mode */\n${theme.lightCSS}\n\n/* Dark Mode */\n${theme.darkCSS}`

  const { error: storageError } = await supabase.storage
    .from("themes")
    .upload(storagePath, cssContent, {
      contentType: "text/css",
      upsert: true,
    })

  if (storageError) {
    console.error("Fehler beim Speichern des Theme-CSS:", storageError)
    return { success: false, error: `CSS-Speicherung fehlgeschlagen: ${storageError.message}` }
  }

  // 2. Metadaten in Datenbank speichern
  const { error: dbError } = await supabase.from("themes").upsert({
    id: theme.id,
    name: theme.name,
    description: theme.description ?? "Importiertes Theme",
    dynamic_fonts: theme.dynamicFonts ?? [],
    is_builtin: false,
  })

  if (dbError) {
    console.error("Fehler beim Speichern der Theme-Metadaten:", dbError)
    // Rollback: CSS löschen
    await supabase.storage.from("themes").remove([storagePath])
    return { success: false, error: `Metadaten-Speicherung fehlgeschlagen: ${dbError.message}` }
  }

  return { success: true }
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
  const supabase = createClient()

  // Prüfe ob Theme existiert und nicht builtin ist
  const { data: theme, error: fetchError } = await supabase
    .from("themes")
    .select("id, is_builtin")
    .eq("id", themeId)
    .single()

  if (fetchError || !theme) {
    return { success: false, error: "Theme nicht gefunden" }
  }

  if (theme.is_builtin) {
    return { success: false, error: "Builtin-Themes können nicht überschrieben werden" }
  }

  // CSS aktualisieren
  if (updates.lightCSS && updates.darkCSS) {
    const storagePath = getTenantStoragePath(`${themeId}.css`)
    const cssContent = `/* Theme: ${themeId} (aktualisiert) */\n\n/* Light Mode */\n${updates.lightCSS}\n\n/* Dark Mode */\n${updates.darkCSS}`

    const { error: storageError } = await supabase.storage
      .from("themes")
      .upload(storagePath, cssContent, {
        contentType: "text/css",
        upsert: true,
      })

    if (storageError) {
      return { success: false, error: `CSS-Update fehlgeschlagen: ${storageError.message}` }
    }
  }

  // Metadaten aktualisieren
  const metaUpdates: Record<string, unknown> = {}
  if (updates.name) metaUpdates.name = updates.name
  if (updates.description) metaUpdates.description = updates.description
  if (updates.dynamicFonts) metaUpdates.dynamic_fonts = updates.dynamicFonts

  if (Object.keys(metaUpdates).length > 0) {
    const { error: dbError } = await supabase.from("themes").update(metaUpdates).eq("id", themeId)

    if (dbError) {
      return { success: false, error: `Metadaten-Update fehlgeschlagen: ${dbError.message}` }
    }
  }

  return { success: true }
}

/**
 * Löscht ein Theme aus Supabase (Metadaten + CSS).
 */
export async function deleteTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Prüfe, ob Theme builtin ist
  const { data: theme } = await supabase
    .from("themes")
    .select("is_builtin")
    .eq("id", themeId)
    .single()

  if (theme?.is_builtin) {
    return { success: false, error: "Builtin-Themes können nicht gelöscht werden" }
  }

  // 1. CSS aus Storage löschen (Multi-Tenant: tenant-spezifischer Ordner)
  const storagePath = getTenantStoragePath(`${themeId}.css`)
  const { error: storageError } = await supabase.storage.from("themes").remove([storagePath])

  if (storageError) {
    console.error("Fehler beim Löschen des Theme-CSS:", storageError)
    // Fortfahren, auch wenn CSS nicht existiert
  }

  // 2. Metadaten aus Datenbank löschen
  const { error: dbError } = await supabase
    .from("themes")
    .delete()
    .eq("id", themeId)
    .eq("is_builtin", false)

  if (dbError) {
    console.error("Fehler beim Löschen der Theme-Metadaten:", dbError)
    return { success: false, error: dbError.message }
  }

  return { success: true }
}

/**
 * Prüft, ob ein Theme mit der ID bereits existiert.
 */
export async function themeExists(themeId: string): Promise<boolean> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("themes")
    .select("id", { count: "exact", head: true })
    .eq("id", themeId)

  if (error) {
    console.error("Fehler bei Theme-Existenzprüfung:", error)
    return false
  }

  return (count ?? 0) > 0
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
  const supabase = createClient()

  const { data, error } = await supabase.from("themes").select("id").eq("is_builtin", false)

  if (error) {
    console.error("Fehler beim Laden der dynamischen Themes:", error)
    return []
  }

  return (data ?? []).map((theme) => ({
    id: theme.id,
    url: getThemeCSSUrl(theme.id),
  }))
}
