/**
 * API Route: App Settings
 *
 * GET: Gibt App-Settings für den aktuellen Tenant zurück
 * PATCH: Aktualisiert App-Settings (upsert - erstellt falls nicht vorhanden)
 *
 * Identifikation erfolgt über NEXT_PUBLIC_TENANT_SLUG
 */

import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Tenant-Slug aus Environment - identifiziert die App eindeutig
 */
function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_TENANT_SLUG || "default"
}

/**
 * GET Handler für App Settings
 * Filtert nach tenant_slug der aktuellen App
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const tenantSlug = getTenantSlug()

    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("tenant_slug", tenantSlug)
      .maybeSingle()

    if (error) {
      console.error("[App Settings API] GET Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Falls keine Settings für diesen Tenant existieren, leeres Objekt zurückgeben
    if (!data) {
      return NextResponse.json({
        tenant_slug: tenantSlug,
        app_name: null,
        app_description: null,
        icon_url: null,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[App Settings API] GET Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH Handler für App Settings
 * Verwendet Upsert - erstellt Eintrag falls nicht vorhanden
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const tenantSlug = getTenantSlug()
    const body = await request.json()

    // Upsert: Update falls vorhanden, Insert falls nicht
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          ...body,
          tenant_slug: tenantSlug,
        },
        {
          onConflict: "tenant_slug",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("[App Settings API] PATCH Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[App Settings API] PATCH Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
