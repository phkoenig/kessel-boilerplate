// AUTH: admin
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { emitRealtimeEvent } from "@/lib/realtime"
import { verifyStoredBlob } from "@/lib/themes/verify-storage"

const MAX_CSS_BYTES = 512 * 1024
const SaveSchema = z.object({
  themeId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  dynamicFonts: z.array(z.string().max(100)).max(50).optional(),
  lightCSS: z.string().min(1).max(MAX_CSS_BYTES),
  darkCSS: z.string().min(1).max(MAX_CSS_BYTES),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) return userOrError

  const parsed = await parseJsonBody(request, SaveSchema)
  if (!parsed.ok) return parsed.response
  const { themeId, name, description, dynamicFonts, lightCSS, darkCSS } = parsed.data

  try {
    if (themeId === "default") {
      return apiError("THEME_PROTECTED", "Das Default-Theme kann nicht überschrieben werden", 400)
    }

    const coreStore = getCoreStore()
    const existingTheme = await coreStore.getThemeRegistryEntry(themeId)
    if (existingTheme) {
      return apiError("THEME_ALREADY_EXISTS", `Theme mit ID "${themeId}" existiert bereits`, 409)
    }

    const storagePath = getTenantStoragePath(`${themeId}.css`)
    const cssContent = `/* Theme: ${name} */\n\n/* Light Mode */\n${lightCSS}\n\n/* Dark Mode */\n${darkCSS}`
    const blobStorage = getBlobStorage()

    try {
      await blobStorage.put("theme_css", storagePath, {
        contentType: "text/css",
        data: cssContent,
        updatedByClerkUserId: userOrError.clerkUserId,
      })
    } catch (err) {
      return apiError("STORAGE_WRITE_FAILED", "CSS-Speicherung fehlgeschlagen", 500, {
        message: err instanceof Error ? err.message : String(err),
      })
    }

    const verification = await verifyStoredBlob("theme_css", storagePath, cssContent)
    if (!verification.ok) {
      await blobStorage.remove("theme_css", storagePath).catch(() => {})
      return apiError(
        "STORAGE_VERIFY_FAILED",
        "Theme-Persistenz-Verifikation fehlgeschlagen — Save wurde zurueckgerollt",
        500,
        { message: verification.reason }
      )
    }
    if (verification.warning) {
      console.warn(
        `[themes/save] Verifikation mit Warnung fuer ${storagePath}: ${verification.warning}`
      )
    }

    const saved = await coreStore.upsertThemeRegistryEntry({
      themeId,
      name,
      description: description?.trim() || "Benutzerdefiniertes Theme",
      dynamicFonts: dynamicFonts ?? [],
      isBuiltin: false,
      cssAssetPath: storagePath,
    })

    if (!saved) {
      await blobStorage.remove("theme_css", storagePath).catch(() => {})
      return apiError("CORE_WRITE_FAILED", "Metadaten-Speicherung fehlgeschlagen", 500)
    }

    emitRealtimeEvent("themes:updated", "db-modified", {})
    return NextResponse.json({
      success: true,
      theme: {
        id: themeId,
        name,
        description: description?.trim() || "Benutzerdefiniertes Theme",
      },
    })
  } catch (error) {
    return apiError("THEME_SAVE_FAILED", "Fehler beim Speichern des Themes", 500, {
      message: error instanceof Error ? error.message : "Unbekannter Fehler",
    })
  }
}
