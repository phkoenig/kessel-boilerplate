import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/reset-password
 *
 * Setzt das Passwort eines Users zurück (nur für Admins)
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
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "userId und newPassword erforderlich" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen haben" },
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

    // Passwort aktualisieren
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Fehler beim Passwort-Reset:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
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
