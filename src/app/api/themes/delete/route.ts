// AUTH: admin
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { getCoreStore } from "@/lib/core"
import { getBlobStorage } from "@/lib/storage"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { requireAdmin } from "@/lib/auth/guards"
import { emitRealtimeEvent } from "@/lib/realtime"

const DeleteSchema = z.object({
  themeId: z.string().trim().min(1).max(100),
})

/**
 * API-Route zum Löschen eines Themes.
 * Entfernt das Theme aus dem Boilerplate-Core und dem Storage.
 * Schutz: requireAdmin
 */
export async function POST(request: NextRequest) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  const parsed = await parseJsonBody(request, DeleteSchema)
  if (!parsed.ok) return parsed.response
  const { themeId } = parsed.data

  try {
    if (themeId === "default") {
      return apiError("THEME_PROTECTED", "Das Default-Theme kann nicht gelöscht werden", 400)
    }

    const coreStore = getCoreStore()
    const theme = await coreStore.getThemeRegistryEntry(themeId)
    if (!theme) {
      return apiError("THEME_NOT_FOUND", `Theme mit ID "${themeId}" nicht gefunden`, 404)
    }

    if (theme.isBuiltin) {
      return apiError("THEME_BUILTIN", "Builtin-Themes können nicht gelöscht werden", 400)
    }

    const dynamicFontsToCheck = theme.dynamicFonts

    const storagePath = theme.cssAssetPath ?? getTenantStoragePath(`${themeId}.css`)
    await getBlobStorage()
      .remove("theme_css", storagePath)
      .catch(() => {})

    const deleted = await coreStore.deleteThemeRegistryEntry(themeId)
    if (!deleted) {
      return apiError("CORE_WRITE_FAILED", "Löschen fehlgeschlagen", 500)
    }

    const remainingDynamicFonts = new Set<string>()
    const remainingThemes = await coreStore.listThemeRegistry()
    remainingThemes.forEach((entry) => {
      entry.dynamicFonts.forEach((font) => remainingDynamicFonts.add(font))
    })

    const unusedFonts = dynamicFontsToCheck.filter(
      (font: string) => !remainingDynamicFonts.has(font)
    )

    const response: {
      success: boolean
      message: string
      cleaned?: {
        fonts?: string[]
        cssBlocks: number
      }
    } = {
      success: true,
      message: `Theme "${theme.name}" wurde erfolgreich gelöscht`,
      cleaned: {
        cssBlocks: 1,
      },
    }

    if (unusedFonts.length > 0) {
      response.cleaned!.fonts = unusedFonts
      response.message += `. ${unusedFonts.length} nicht mehr verwendete Font(s) identifiziert: ${unusedFonts.join(", ")}`
    }

    emitRealtimeEvent("themes:updated", "db-modified", {})
    return NextResponse.json(response)
  } catch (error) {
    console.error("Fehler beim Löschen des Themes:", error)
    return apiError("THEME_DELETE_FAILED", "Fehler beim Löschen des Themes", 500, {
      message: error instanceof Error ? error.message : "Unbekannter Fehler",
    })
  }
}
