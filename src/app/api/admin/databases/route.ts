// AUTH: admin
// BOILERPLATE: example-feature (depends on Supabase)
// Siehe docs/12_plans/260419-boilerplate-db-agnostik.md (Plan I1).
import { NextResponse } from "next/server"
import { apiError } from "@/lib/api/errors"
import { isSupabaseExamplesEnabled } from "@/lib/config/features"
import { createClient } from "@/utils/supabase/server"
import { loadDatabaseRegistry } from "@/lib/database/db-registry"
import type { DatabaseConfig } from "@/lib/database/types"
import { requireAdmin } from "@/lib/auth/guards"

/**
 * GET /api/admin/databases
 *
 * Lädt alle registrierten Datenbanken
 */
export async function GET() {
  try {
    if (!isSupabaseExamplesEnabled()) {
      return apiError(
        "SUPABASE_NOT_CONFIGURED",
        "Dieses Beispiel-Feature (Datenquellen) benoetigt eine Supabase-Konfiguration.",
        503
      )
    }

    const userOrError = await requireAdmin()
    if (userOrError instanceof Response) {
      return userOrError
    }

    // Lade Registry
    const databases = await loadDatabaseRegistry()

    return NextResponse.json({ databases })
  } catch (error) {
    console.error("[Admin Databases API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/databases
 *
 * Registriert eine neue Datenbank
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseExamplesEnabled()) {
      return apiError(
        "SUPABASE_NOT_CONFIGURED",
        "Dieses Beispiel-Feature (Datenquellen) benoetigt eine Supabase-Konfiguration.",
        503
      )
    }

    const userOrError = await requireAdmin()
    if (userOrError instanceof Response) {
      return userOrError
    }

    const supabase = await createClient()

    // Request Body lesen
    const body: Partial<DatabaseConfig> = await request.json()
    const { id, name, description, connection_type, env_url_key, env_anon_key, env_service_key } =
      body

    if (!id || !name || !connection_type) {
      return NextResponse.json(
        { error: "id, name und connection_type sind erforderlich" },
        { status: 400 }
      )
    }

    if (connection_type !== "supabase") {
      return NextResponse.json(
        { error: "Nur 'supabase' connection_type wird aktuell unterstützt" },
        { status: 400 }
      )
    }

    // Erstelle Eintrag in db_registry
    const { data, error } = await supabase
      .from("db_registry")
      .insert({
        id,
        name,
        description: description ?? null,
        connection_type,
        env_url_key: env_url_key ?? null,
        env_anon_key: env_anon_key ?? null,
        env_service_key: env_service_key ?? null,
        is_enabled: true,
        is_default: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[Admin Databases API] Fehler beim Erstellen:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ database: data })
  } catch (error) {
    console.error("[Admin Databases API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/databases
 *
 * Aktualisiert eine Datenbank-Konfiguration
 */
export async function PUT(request: Request) {
  try {
    const userOrError = await requireAdmin()
    if (userOrError instanceof Response) {
      return userOrError
    }

    const supabase = await createClient()

    // Request Body lesen
    const body: Partial<DatabaseConfig> & { id: string } = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 })
    }

    // Aktualisiere Eintrag
    const { data, error } = await supabase
      .from("db_registry")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Databases API] Fehler beim Aktualisieren:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ database: data })
  } catch (error) {
    console.error("[Admin Databases API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/databases
 *
 * Entfernt eine Datenbank aus der Registry
 */
export async function DELETE(request: Request) {
  try {
    const userOrError = await requireAdmin()
    if (userOrError instanceof Response) {
      return userOrError
    }

    const supabase = await createClient()

    // Request Body lesen
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id ist erforderlich" }, { status: 400 })
    }

    // Verhindere Löschung von KESSEL
    if (id === "kessel") {
      return NextResponse.json(
        { error: "KESSEL-Datenbank kann nicht gelöscht werden" },
        { status: 400 }
      )
    }

    // Lösche Eintrag (CASCADE löscht auch ai_datasources Einträge)
    const { error } = await supabase.from("db_registry").delete().eq("id", id)

    if (error) {
      console.error("[Admin Databases API] Fehler beim Löschen:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin Databases API] Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
