import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { getTenantStoragePath } from "@/lib/utils/tenant"
import { createServiceClient } from "@/utils/supabase/service"
import { emitRealtimeEvent } from "@/lib/realtime"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userOrError = await requireAdmin()
  if (userOrError instanceof Response) {
    return userOrError
  }

  try {
    const body = (await request.json()) as {
      themeId?: string
      name?: string
      description?: string
      dynamicFonts?: string[]
      lightCSS?: string
      darkCSS?: string
    }

    const themeId = body.themeId?.trim()
    const name = body.name?.trim()
    if (!themeId || !name) {
      return NextResponse.json({ error: "Theme-ID und Name sind erforderlich" }, { status: 400 })
    }

    if (themeId === "default") {
      return NextResponse.json(
        { error: "Das Default-Theme kann nicht überschrieben werden" },
        { status: 400 }
      )
    }

    if (typeof body.lightCSS !== "string" || typeof body.darkCSS !== "string") {
      return NextResponse.json({ error: "Light- und Dark-CSS sind erforderlich" }, { status: 400 })
    }

    const coreStore = getCoreStore()
    const existingTheme = await coreStore.getThemeRegistryEntry(themeId)
    if (existingTheme) {
      return NextResponse.json(
        { error: `Theme mit ID "${themeId}" existiert bereits` },
        { status: 400 }
      )
    }

    const storagePath = getTenantStoragePath(`${themeId}.css`)
    const cssContent = `/* Theme: ${name} */\n\n/* Light Mode */\n${body.lightCSS}\n\n/* Dark Mode */\n${body.darkCSS}`

    // Clerk-Auth liefert kein Supabase-JWT (nur anon) -> Storage-RLS blockiert INSERT.
    // Nach requireAdmin: Service-Role nur serverseitig fuer diesen Bucket.
    const supabase = createServiceClient()
    const { error: storageError } = await supabase.storage
      .from("themes")
      .upload(storagePath, cssContent, {
        contentType: "text/css",
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json(
        { error: `CSS-Speicherung fehlgeschlagen: ${storageError.message}` },
        { status: 500 }
      )
    }

    const saved = await coreStore.upsertThemeRegistryEntry({
      themeId,
      name,
      description: body.description?.trim() || "Benutzerdefiniertes Theme",
      dynamicFonts: Array.isArray(body.dynamicFonts)
        ? body.dynamicFonts.filter((entry): entry is string => typeof entry === "string")
        : [],
      isBuiltin: false,
      cssAssetPath: storagePath,
    })

    if (!saved) {
      await supabase.storage
        .from("themes")
        .remove([storagePath])
        .catch(() => {})
      return NextResponse.json({ error: "Metadaten-Speicherung fehlgeschlagen" }, { status: 500 })
    }

    emitRealtimeEvent("themes:updated", "db-modified", {})
    return NextResponse.json({
      success: true,
      theme: {
        id: themeId,
        name,
        description: body.description?.trim() || "Benutzerdefiniertes Theme",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Fehler beim Speichern des Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
