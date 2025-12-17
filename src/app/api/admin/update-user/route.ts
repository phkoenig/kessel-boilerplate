import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/update-user
 *
 * Aktualisiert User-Daten (E-Mail) - nur für Admins
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
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "userId und email erforderlich" }, { status: 400 })
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
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

    // E-Mail aktualisieren
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      email,
    })

    if (updateError) {
      console.error("Fehler beim Aktualisieren der E-Mail:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Aktualisiere auch die profiles Tabelle
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ email })
      .eq("id", userId)

    if (profileError) {
      console.error("Fehler beim Aktualisieren des Profils:", profileError)
      // Nicht kritisch, da Auth bereits aktualisiert wurde
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
