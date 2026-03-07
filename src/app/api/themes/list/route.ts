import { NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"
import { ensureThemeRegistryBootstrapped } from "@/lib/themes/registry-bootstrap"

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
 * Liefert Theme-Metadaten aus dem Boilerplate-Core.
 */
export async function GET() {
  try {
    await ensureThemeRegistryBootstrapped()
    const themes = await getCoreStore().listThemeRegistry()
    const themeMetas: ThemeMeta[] = themes.map((theme) => ({
      id: theme.themeId,
      name: theme.name,
      description: theme.description || "",
      dynamicFonts: theme.dynamicFonts,
      isBuiltin: theme.isBuiltin,
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
