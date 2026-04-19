import { NextRequest, NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { createServiceClient } from "@/utils/supabase/service"
import { requireAdmin } from "@/lib/auth/guards"
import { emitRealtimeEvent } from "@/lib/realtime"

/**
 * API-Route zum Löschen eines Themes.
 * Entfernt das Theme aus dem Boilerplate-Core und dem Storage.
 * Schutz: requireAdmin
 */
export async function POST(request: NextRequest) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  try {
    const { themeId } = await request.json()

    if (!themeId) {
      return NextResponse.json({ error: "Theme-ID ist erforderlich" }, { status: 400 })
    }

    if (themeId === "default") {
      return NextResponse.json(
        { error: "Das Default-Theme kann nicht gelöscht werden" },
        { status: 400 }
      )
    }

    const coreStore = getCoreStore()
    const theme = await coreStore.getThemeRegistryEntry(themeId)
    if (!theme) {
      return NextResponse.json(
        { error: `Theme mit ID "${themeId}" nicht gefunden` },
        { status: 404 }
      )
    }

    if (theme.isBuiltin) {
      return NextResponse.json(
        { error: "Builtin-Themes können nicht gelöscht werden" },
        { status: 400 }
      )
    }

    const dynamicFontsToCheck = theme.dynamicFonts

    const supabase = createServiceClient()
    const storagePath = theme.cssAssetPath ?? getTenantStoragePath(`${themeId}.css`)
    const { error: storageError } = await supabase.storage.from("themes").remove([storagePath])

    if (storageError) {
      // CSS-Datei existiert möglicherweise nicht – fortfahren
    }

    const deleted = await coreStore.deleteThemeRegistryEntry(themeId)
    if (!deleted) {
      return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 })
    }

    const remainingDynamicFonts = new Set<string>()
    const remainingThemes = await coreStore.listThemeRegistry()
    remainingThemes.forEach((entry) => {
      entry.dynamicFonts.forEach((font) => remainingDynamicFonts.add(font))
    })

    // Identifiziere nicht mehr verwendete Fonts
    const unusedFonts = dynamicFontsToCheck.filter(
      (font: string) => !remainingDynamicFonts.has(font)
    )

    // Erstelle Response mit Informationen über bereinigte Ressourcen
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
        cssBlocks: 1, // CSS-Datei im Storage
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
    return NextResponse.json(
      {
        error: "Fehler beim Löschen des Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
