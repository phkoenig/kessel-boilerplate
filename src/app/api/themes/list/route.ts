import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Theme-Metadaten Typ.
 */
interface ThemeMeta {
  id: string
  name: string
  description: string
  dynamicFonts?: string[]
  isBuiltin: boolean
}

/**
 * API-Route zum Auflisten aller Themes.
 * Kombiniert lokale (builtin) Themes mit dynamischen Themes aus Supabase.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Lade alle Themes aus der Datenbank
    const { data: themes, error } = await supabase
      .from("themes")
      .select("id, name, description, dynamic_fonts, is_builtin")
      .order("is_builtin", { ascending: false })
      .order("name")

    if (error) {
      console.error("Fehler beim Laden der Themes:", error)
      return NextResponse.json({ error: "Themes konnten nicht geladen werden" }, { status: 500 })
    }

    // Transformiere zu ThemeMeta-Format
    const themeMetas: ThemeMeta[] = (themes ?? []).map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description || "",
      dynamicFonts: theme.dynamic_fonts || [],
      isBuiltin: theme.is_builtin,
    }))

    return NextResponse.json({
      success: true,
      themes: themeMetas,
    })
  } catch (error) {
    console.error("Fehler beim Auflisten der Themes:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Auflisten der Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
