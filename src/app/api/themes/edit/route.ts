import { NextRequest, NextResponse } from "next/server"
import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/guards"

/**
 * API-Route zum Bearbeiten eines Themes.
 * Aktualisiert Theme-Metadaten im Boilerplate-Core und optional das CSS im Storage.
 * Schutz: requireAdmin
 */
export async function POST(request: NextRequest) {
  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

  try {
    const { themeId, name, description, dynamicFonts, lightCSS, darkCSS } = await request.json()

    if (!themeId) {
      return NextResponse.json({ error: "Theme-ID ist erforderlich" }, { status: 400 })
    }

    if (themeId === "default") {
      return NextResponse.json(
        { error: "Das Default-Theme kann nicht bearbeitet werden" },
        { status: 400 }
      )
    }

    const coreStore = getCoreStore()
    const existingTheme = await coreStore.getThemeRegistryEntry(themeId)
    if (!existingTheme) {
      return NextResponse.json(
        { error: `Theme mit ID "${themeId}" nicht gefunden` },
        { status: 404 }
      )
    }

    if (existingTheme.isBuiltin) {
      return NextResponse.json(
        { error: "Builtin-Themes können nicht bearbeitet werden" },
        { status: 400 }
      )
    }

    const nextName = typeof name === "string" && name.trim() ? name.trim() : existingTheme.name
    const nextDescription =
      description === undefined ? existingTheme.description : String(description || "").trim()
    const nextDynamicFonts = Array.isArray(dynamicFonts)
      ? dynamicFonts.filter((entry): entry is string => typeof entry === "string")
      : existingTheme.dynamicFonts

    let cssAssetPath = existingTheme.cssAssetPath
    if (typeof lightCSS === "string" && typeof darkCSS === "string") {
      const supabase = await createClient()
      const storagePath = getTenantStoragePath(`${themeId}.css`)
      const cssContent = `/* Theme: ${nextName} */\n\n/* Light Mode */\n${lightCSS}\n\n/* Dark Mode */\n${darkCSS}`
      const { error: storageError } = await supabase.storage
        .from("themes")
        .upload(storagePath, cssContent, {
          contentType: "text/css",
          upsert: true,
        })

      if (storageError) {
        return NextResponse.json(
          { error: `CSS-Update fehlgeschlagen: ${storageError.message}` },
          { status: 500 }
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
      return NextResponse.json({ error: "Aktualisierung fehlgeschlagen" }, { status: 500 })
    }

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
    return NextResponse.json(
      {
        error: "Fehler beim Bearbeiten des Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
