export interface AppBrandingPayload {
  tenant_slug?: string | null
  app_name?: string | null
  app_description?: string | null
  icon_url?: string | null
  icon_variants?: Array<{ url: string }> | null
  icon_provider?: string | null
}

export interface ResolvedAppBranding {
  tenantSlug: string
  appName: string
  appDescription: string
  iconUrl: string | null
  iconVariants: Array<{ url: string }>
  iconProvider: string | null
}

const BOILERPLATE_DEFAULTS = ["Kessel App", "Test Demo 123", "Testdemo123"]

export const getTenantSlug = (): string => process.env.NEXT_PUBLIC_TENANT_SLUG || "default"

export const getEnvAppName = (): string => process.env.NEXT_PUBLIC_APP_NAME?.trim() || ""

export const resolveAppName = (dbName: string | null | undefined): string => {
  const normalizedDbName = dbName?.trim() ?? ""
  const envAppName = getEnvAppName()
  const isDbDefault = BOILERPLATE_DEFAULTS.some(
    (defaultName) => defaultName.toLowerCase() === normalizedDbName.toLowerCase()
  )

  if (normalizedDbName && !isDbDefault) {
    return normalizedDbName
  }

  if (envAppName) {
    return envAppName
  }

  return "Kessel App"
}

export const resolveAppBranding = (payload?: AppBrandingPayload | null): ResolvedAppBranding => {
  return {
    tenantSlug: payload?.tenant_slug?.trim() || getTenantSlug(),
    appName: resolveAppName(payload?.app_name),
    appDescription:
      payload?.app_description?.trim() ||
      "ShadCN UI mit TweakCN Theme-Switching und Tailwind CSS v4",
    iconUrl: payload?.icon_url?.trim() || null,
    iconVariants: payload?.icon_variants?.filter((entry) => typeof entry.url === "string") ?? [],
    iconProvider: payload?.icon_provider?.trim() || null,
  }
}
