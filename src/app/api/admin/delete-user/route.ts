import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/delete-user
 *
 * Löscht einen User komplett (Auth + Profile) - nur für Admins
 */
export async function POST(request: Request) {
  try {
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

    if (!profile || (profile.role !== "admin" && profile.role !== "super-user")) {
      return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 })
    }

    // Request Body lesen
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId erforderlich" }, { status: 400 })
    }

    // Verhindere Selbstlöschung
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Du kannst deinen eigenen Account nicht löschen" },
        { status: 400 }
      )
    }

    // Service Role Client für Admin-Operationen
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server-Konfiguration fehlt" }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Lösche alle abhängigen Daten VOR dem Auth-User
    // (Supabase löscht zwar automatisch via Trigger, aber manche Foreign Keys können Probleme machen)

    // 1. Lösche alle Tenant-Zuordnungen (app.user_tenants)
    try {
      const { error: tenantError } = await adminClient.rpc("delete_user_tenant_assignments", {
        p_user_id: userId,
      })
      if (tenantError) {
        console.warn("Warnung beim Löschen der Tenant-Zuordnungen:", tenantError.message)
      }
    } catch (err) {
      console.warn("Exception beim Löschen der Tenant-Zuordnungen:", err)
    }

    // 2. Lösche alle Feature-Votes (public.feature_votes)
    try {
      const { error: votesError } = await adminClient
        .from("feature_votes")
        .delete()
        .eq("user_id", userId)
      if (votesError) {
        console.warn("Warnung beim Löschen der Feature-Votes:", votesError.message)
      }
    } catch (err) {
      console.warn("Exception beim Löschen der Feature-Votes:", err)
    }

    // 3. Lösche alle AI Tool Calls (public.ai_tool_calls)
    try {
      const { error: toolCallsError } = await adminClient
        .from("ai_tool_calls")
        .delete()
        .eq("user_id", userId)
      if (toolCallsError) {
        console.warn("Warnung beim Löschen der AI Tool Calls:", toolCallsError.message)
      }
    } catch (err) {
      console.warn("Exception beim Löschen der AI Tool Calls:", err)
    }

    // 4. Lösche Auth-User (dies löscht automatisch das Profil und andere abhängige Daten via Trigger)
    // WICHTIG: Dies sollte alle restlichen Abhängigkeiten automatisch löschen
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Fehler beim Löschen des Auth-Users:", deleteError)
      // Gebe detaillierte Fehlermeldung zurück
      const errorMessage =
        deleteError.message || deleteError.toString() || "Unbekannter Fehler beim Löschen des Users"
      return NextResponse.json(
        {
          error: `DatabaseError: ${errorMessage}`,
          details: {
            code: deleteError.code,
            message: deleteError.message,
            status: deleteError.status,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
