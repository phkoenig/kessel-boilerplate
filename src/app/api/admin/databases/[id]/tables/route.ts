import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { discoverTables, syncDatasourcesForDatabase } from "@/lib/database/db-registry"

/**
 * GET /api/admin/databases/[id]/tables
 *
 * Listet alle verfügbaren Tabellen einer Datenbank auf
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authentifizierung prüfen
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Admin-Rolle prüfen
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "superuser")) {
      return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 })
    }

    // Lade bereits registrierte Tabellen aus ai_datasources
    const { data: existingTables, error: existingError } = await supabase
      .from("ai_datasources")
      .select("table_schema, table_name, display_name, is_enabled, access_level")
      .eq("database_id", id)
      .order("table_name")

    if (existingError) {
      console.error("[Admin Databases Tables API] Fehler beim Laden:", existingError)
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    // Wenn Tabellen existieren, gib sie zurück
    if (existingTables && existingTables.length > 0) {
      return NextResponse.json({
        tables: existingTables.map((t) => ({
          table_schema: t.table_schema,
          table_name: t.table_name,
          display_name: t.display_name,
          is_enabled: t.is_enabled,
          access_level: t.access_level,
        })),
      })
    }

    // Falls keine existieren, versuche zu entdecken (nur für lokale DBs sinnvoll)
    const tables = await discoverTables(id)

    return NextResponse.json({ tables })
  } catch (error) {
    console.error("[Admin Databases Tables API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/databases/[id]/tables
 *
 * Synchronisiert Tabellen zu ai_datasources oder aktiviert/deaktiviert spezifische Tabellen
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authentifizierung prüfen
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // Admin-Rolle prüfen
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "superuser")) {
      return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 })
    }

    // Request Body lesen
    const body = await request.json()
    const { action, tableNames } = body

    if (action === "sync") {
      // Synchronisiere alle Tabellen
      await syncDatasourcesForDatabase(id)
      return NextResponse.json({ success: true, message: "Tabellen synchronisiert" })
    }

    if (action === "toggle" && Array.isArray(tableNames)) {
      // Aktiviere/Deaktiviere spezifische Tabellen
      const { enabled } = body

      if (typeof enabled !== "boolean") {
        return NextResponse.json({ error: "enabled muss boolean sein" }, { status: 400 })
      }

      // Aktualisiere ai_datasources
      const { error } = await supabase
        .from("ai_datasources")
        .update({ is_enabled: enabled })
        .eq("database_id", id)
        .in("table_name", tableNames)

      if (error) {
        console.error("[Admin Databases Tables API] Fehler beim Toggle:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `${tableNames.length} Tabellen ${enabled ? "aktiviert" : "deaktiviert"}`,
      })
    }

    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 })
  } catch (error) {
    console.error("[Admin Databases Tables API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
