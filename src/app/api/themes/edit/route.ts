import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * API-Route zum Bearbeiten eines Themes.
 * Aktualisiert Name und Beschreibung in der Supabase-Datenbank.
 */
export async function POST(request: NextRequest) {
  try {
    const { themeId, name, description } = await request.json()

    if (!themeId || !name) {
      return NextResponse.json({ error: "Theme-ID und Name sind erforderlich" }, { status: 400 })
    }

    if (themeId === "default") {
      return NextResponse.json(
        { error: "Das Default-Theme kann nicht bearbeitet werden" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Prüfe, ob Theme existiert und ob es builtin ist
    const { data: theme, error: fetchError } = await supabase
      .from("themes")
      .select("id, is_builtin")
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
        { error: "Builtin-Themes können nicht bearbeitet werden" },
        { status: 400 }
      )
    }

    // Aktualisiere Theme
    const { error: updateError } = await supabase
      .from("themes")
      .update({
        name,
        description: description || "",
      })
      .eq("id", themeId)

    if (updateError) {
      console.error("Fehler beim Aktualisieren des Themes:", updateError)
      return NextResponse.json(
        { error: `Aktualisierung fehlgeschlagen: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      theme: {
        id: themeId,
        name,
        description: description || "",
      },
    })
  } catch (error) {
    console.error("Fehler beim Bearbeiten des Themes:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Bearbeiten des Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
