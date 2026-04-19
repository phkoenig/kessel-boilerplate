// AUTH: admin
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { createServiceClient } from "@/utils/supabase/service"
import { requireAdmin } from "@/lib/auth/guards"
import { emitRealtimeEvent } from "@/lib/realtime"
import { verifyStoredThemeCss } from "@/lib/themes/verify-storage"

const MAX_CSS_BYTES = 512 * 1024
const EditSchema = z.object({
  themeId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  dynamicFonts: z.array(z.string().max(100)).max(50).optional(),
  lightCSS: z.string().max(MAX_CSS_BYTES).optional(),
  darkCSS: z.string().max(MAX_CSS_BYTES).optional(),
})

/**
 * API-Route zum Bearbeiten eines Themes.
 * Aktualisiert Theme-Metadaten im Boilerplate-Core und optional das CSS im Storage.
 * Schutz: requireAdmin
 */
export async function POST(request: NextRequest) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  const parsed = await parseJsonBody(request, EditSchema)
  if (!parsed.ok) return parsed.response
  const { themeId, name, description, dynamicFonts, lightCSS, darkCSS } = parsed.data

  try {
    if (themeId === "default") {
      return apiError("THEME_PROTECTED", "Das Default-Theme kann nicht bearbeitet werden", 400)
    }

    const coreStore = getCoreStore()
    const existingTheme = await coreStore.getThemeRegistryEntry(themeId)
    if (!existingTheme) {
      return apiError("THEME_NOT_FOUND", `Theme mit ID "${themeId}" nicht gefunden`, 404)
    }

    if (existingTheme.isBuiltin) {
      return apiError("THEME_BUILTIN", "Builtin-Themes können nicht bearbeitet werden", 400)
    }

    const nextName = name ?? existingTheme.name
    const nextDescription =
      description === undefined ? existingTheme.description : description.trim()
    const nextDynamicFonts = dynamicFonts ?? existingTheme.dynamicFonts

    let cssAssetPath = existingTheme.cssAssetPath
    if (typeof lightCSS === "string" && typeof darkCSS === "string") {
      const supabase = createServiceClient()
      const storagePath = getTenantStoragePath(`${themeId}.css`)
      const cssContent = `/* Theme: ${nextName} */\n\n/* Light Mode */\n${lightCSS}\n\n/* Dark Mode */\n${darkCSS}`
      const { error: storageError } = await supabase.storage
        .from("themes")
        .upload(storagePath, cssContent, {
          contentType: "text/css",
          upsert: true,
        })

      if (storageError) {
        return apiError("STORAGE_WRITE_FAILED", "CSS-Update fehlgeschlagen", 500, {
          message: storageError.message,
        })
      }

      const verification = await verifyStoredThemeCss(supabase, storagePath, cssContent)
      if (!verification.ok) {
        return apiError(
          "STORAGE_VERIFY_FAILED",
          "Theme-Persistenz-Verifikation fehlgeschlagen — CSS wurde nicht korrekt abgelegt",
          500,
          { message: verification.reason }
        )
      }

      cssAssetPath = storagePath
    }

    const updated = await coreStore.upsertThemeRegistryEntry({
      themeId,
      name: nextName,
      description: nextDescription,
      dynamicFonts: nextDynamicFonts,
      isBuiltin: existingTheme.isBuiltin,
      cssAssetPath,
    })

    if (!updated) {
      return apiError("CORE_WRITE_FAILED", "Aktualisierung fehlgeschlagen", 500)
    }

    emitRealtimeEvent("themes:updated", "db-modified", {})
    return NextResponse.json({
      success: true,
      theme: {
        id: themeId,
        name: nextName,
        description: nextDescription || "",
      },
    })
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Themes:", error)
    return apiError("THEME_EDIT_FAILED", "Fehler beim Bearbeiten des Themes", 500, {
      message: error instanceof Error ? error.message : "Unbekannter Fehler",
    })
  }
}
