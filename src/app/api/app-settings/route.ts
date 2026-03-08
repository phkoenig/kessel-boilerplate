/**
 * API Route: App Settings
 *
 * GET: Gibt Branding-/App-Settings für den aktuellen Tenant zurück
 * PATCH: Aktualisiert App-Settings (upsert - erstellt falls nicht vorhanden)
 *
 * Identifikation erfolgt über NEXT_PUBLIC_TENANT_SLUG
 * GET ist bewusst öffentlich lesbar, damit Branding und Metadaten ohne
 * zusätzliche Auth-Umwege konsistent aufgelöst werden können.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { resolveAppBranding } from "@/lib/branding"

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
    const tenantSlug = getTenantSlug()
    const data = await getCoreStore().getAppSettings(tenantSlug)
    const resolved = resolveAppBranding(
      data
        ? {
            tenant_slug: data.tenantSlug,
            app_name: data.appName,
            app_description: data.appDescription,
            icon_url: data.iconUrl,
            icon_variants: data.iconVariants ?? [],
            icon_provider: data.iconProvider ?? null,
          }
        : {
            tenant_slug: tenantSlug,
          }
    )

    return NextResponse.json({
      tenant_slug: resolved.tenantSlug,
      app_name: resolved.appName,
      app_description: resolved.appDescription,
      icon_url: resolved.iconUrl,
      icon_variants: resolved.iconVariants,
      icon_provider: resolved.iconProvider,
      core_runtime_mode: getCoreStore().getMode(),
    })
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
  const userOrErr = await requireAuth()
  if (userOrErr instanceof Response) return userOrErr

  try {
    const tenantSlug = getTenantSlug()
    const body = await request.json()
    const data = await getCoreStore().upsertAppSettings(tenantSlug, {
      appName: typeof body.app_name === "string" ? body.app_name : undefined,
      appDescription: typeof body.app_description === "string" ? body.app_description : undefined,
      iconUrl: typeof body.icon_url === "string" ? body.icon_url : undefined,
      iconVariants: Array.isArray(body.icon_variants) ? body.icon_variants : undefined,
      iconProvider: typeof body.icon_provider === "string" ? body.icon_provider : undefined,
    })

    if (!data) {
      return NextResponse.json(
        { error: "App-Settings konnten nicht gespeichert werden" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tenant_slug: data.tenantSlug,
      app_name: data.appName,
      app_description: data.appDescription,
      icon_url: data.iconUrl,
      icon_variants: data.iconVariants ?? [],
      icon_provider: data.iconProvider ?? null,
      core_runtime_mode: getCoreStore().getMode(),
    })
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
