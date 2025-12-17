import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * API-Route zum Löschen eines Themes.
 * Entfernt das Theme aus der Supabase-Datenbank und dem Storage.
 */
export async function POST(request: NextRequest) {
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

    const supabase = await createClient()

    // Prüfe, ob Theme existiert und ob es builtin ist
    const { data: theme, error: fetchError } = await supabase
      .from("themes")
      .select("id, name, is_builtin, dynamic_fonts")
      .eq("id", themeId)
      .single()

    if (fetchError || !theme) {
      return NextResponse.json(
        { error: `Theme mit ID "${themeId}" nicht gefunden` },
        { status: 404 }
      )
    }

    if (theme.is_builtin) {
      return NextResponse.json(
        { error: "Builtin-Themes können nicht gelöscht werden" },
        { status: 400 }
      )
    }

    // Speichere dynamicFonts des zu löschenden Themes für spätere Bereinigung
    const dynamicFontsToCheck = theme.dynamic_fonts || []

    // 1. CSS aus Storage löschen
    const { error: storageError } = await supabase.storage.from("themes").remove([`${themeId}.css`])

    if (storageError) {
      console.warn(`CSS-Datei für Theme "${themeId}" konnte nicht gelöscht werden:`, storageError)
      // Fortfahren, auch wenn CSS nicht existiert
    }

    // 2. Metadaten aus Datenbank löschen
    const { error: dbError } = await supabase.from("themes").delete().eq("id", themeId)

    if (dbError) {
      console.error("Fehler beim Löschen der Theme-Metadaten:", dbError)
      return NextResponse.json(
        { error: `Löschen fehlgeschlagen: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Prüfe, ob die dynamicFonts noch von anderen Themes verwendet werden
    const { data: remainingThemes } = await supabase
      .from("themes")
      .select("dynamic_fonts")
      .neq("id", themeId)

    const remainingDynamicFonts = new Set<string>()
    remainingThemes?.forEach((t) => {
      if (t.dynamic_fonts) {
        t.dynamic_fonts.forEach((font: string) => remainingDynamicFonts.add(font))
      }
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
      message: `Theme "${themeId}" wurde erfolgreich gelöscht`,
      cleaned: {
        cssBlocks: 1, // CSS-Datei im Storage
      },
    }

    if (unusedFonts.length > 0) {
      response.cleaned!.fonts = unusedFonts
      response.message += `. ${unusedFonts.length} nicht mehr verwendete Font(s) identifiziert: ${unusedFonts.join(", ")}`
    }

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
