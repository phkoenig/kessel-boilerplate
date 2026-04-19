// AUTH: authenticated
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
import { z } from "zod"
import { apiError } from "@/lib/api/errors"
import { parseJsonBody } from "@/lib/api/parse-body"
import { requireAuth } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import { getCachedAppSettings, invalidateAppSettingsCache } from "@/lib/core/server-cache"
import { resolveAppBranding } from "@/lib/branding"

// URL-Limit bewusst großzügig: Supabase-Storage-URLs enthalten Tenant-Prefix,
// Bucket, langen Objekt-Pfad und ggf. Query-Params — 2048 Zeichen waren in
// der Praxis zu knapp und haben App-Icon-Saves gekippt.
const PatchSchema = z.object({
  app_name: z.string().max(200).optional(),
  app_description: z.string().max(1000).optional(),
  icon_url: z.string().url().max(8192).optional(),
  icon_variants: z
    .array(z.object({ url: z.string().url().max(8192) }))
    .max(20)
    .optional(),
  icon_provider: z.string().max(100).optional(),
})

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
    const data = await getCachedAppSettings(tenantSlug)
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

  const parsed = await parseJsonBody(request, PatchSchema)
  if (!parsed.ok) return parsed.response

  try {
    const tenantSlug = getTenantSlug()
    invalidateAppSettingsCache(tenantSlug)
    const body = parsed.data
    const data = await getCoreStore().upsertAppSettings(tenantSlug, {
      appName: body.app_name,
      appDescription: body.app_description,
      iconUrl: body.icon_url,
      iconVariants: body.icon_variants,
      iconProvider: body.icon_provider,
    })

    if (!data) {
      return apiError("CORE_WRITE_FAILED", "App-Settings konnten nicht gespeichert werden", 500)
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
    return apiError("INTERNAL", "Internal server error", 500, {
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
