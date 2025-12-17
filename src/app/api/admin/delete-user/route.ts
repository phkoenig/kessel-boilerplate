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

    // 1. Lösche Profile (wird automatisch durch Foreign Key Constraint auch gelöscht, aber sicherheitshalber explizit)
    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Fehler beim Löschen des Profils:", profileError)
      // Fortfahren, auch wenn Profil nicht existiert
    }

    // 2. Lösche Auth-User (dies löscht auch automatisch das Profil durch Trigger)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Fehler beim Löschen des Users:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
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
