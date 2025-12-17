import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/create-user
 *
 * Erstellt einen neuen User - nur für Admins
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
    const { email, password, displayName, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort sind erforderlich" }, { status: 400 })
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
    }

    // Passwort-Validierung (min. 6 Zeichen)
    if (password.length < 6) {
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

    // User erstellen - WICHTIG: role in user_metadata übergeben für den Trigger
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // E-Mail als bestätigt markieren
      user_metadata: {
        display_name: displayName || null,
        role: role || "user", // Wird vom handle_new_user Trigger gelesen
      },
    })

    if (createError) {
      console.error("Fehler beim Erstellen des Users:", createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: "User konnte nicht erstellt werden" }, { status: 500 })
    }

    // HINWEIS: Der Trigger handle_new_user setzt bereits:
    // - email, display_name, role, role_id
    // Daher ist kein Post-Creation Update mehr nötig.
    // Die Rolle wird aus user_metadata.role gelesen.

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
