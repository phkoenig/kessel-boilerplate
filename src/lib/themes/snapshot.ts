/**
 * Server-Snapshot des effektiven Theme-Zustands.
 *
 * Architektur (Theme-Scope-Switch):
 *   Der `themeScope` in `app_settings` entscheidet, wie das aktive Theme bestimmt wird.
 *
 *   - `"global"` (Default): Es gibt **ein** App-weites Brand-Theme fuer ALLE User.
 *     Quelle ist `app_settings.globalThemeId`; Fallback auf das Theme des ersten
 *     Admin-Users (Backward-Compat) und schliesslich auf {@link DEFAULT_THEME_ID}.
 *     Aenderungen sind admin-only.
 *   - `"per_user"`: Jeder User waehlt sein eigenes Theme. Quelle ist
 *     {@link CoreUserThemeState.theme}.
 *
 *   Color-Scheme (Dark/Light/System) bleibt immer eine persoenliche User-Praeferenz.
 *
 * Diese Funktion ist Server-only (nutzt `unstable_noStore` und Clerk-auth).
 */

import { unstable_noStore } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { isAdminRole } from "@/lib/auth/provisioning-role"
import { getTenantSlug } from "@/lib/branding"
import { getCoreStore } from "@/lib/core"
import type { CoreAppSettings } from "@/lib/core/types"
import { resolveThemeCss, extractCornerStyleFromCss } from "./css"
import { DEFAULT_THEME_ID } from "./constants"
import type { ThemeColorScheme, ThemeMeta, ThemeSnapshot } from "./types"

function coreThemeToMeta(theme: {
  themeId: string
  name: string
  description: string | null
  dynamicFonts: string[]
  isBuiltin: boolean
}): ThemeMeta {
  return {
    id: theme.themeId,
    name: theme.name,
    description: theme.description ?? "",
    dynamicFonts: theme.dynamicFonts ?? [],
    isBuiltin: theme.isBuiltin,
  }
}

function normalizeColorScheme(value: string | null | undefined): ThemeColorScheme {
  return value === "dark" || value === "light" || value === "system" ? value : "system"
}

/**
 * Liest den effektiven Theme-Scope aus den App-Settings.
 * Default ist `"global"` (Backward-Compat).
 */
function resolveThemeScope(settings: CoreAppSettings | null): "global" | "per_user" {
  return settings?.themeScope === "per_user" ? "per_user" : "global"
}

/**
 * Liefert den effektiven Theme-Snapshot fuer den aktuellen User.
 *
 * - Nicht eingeloggte User bekommen Default-Theme + system-ColorScheme.
 * - Bei `themeScope === "global"` sehen ALLE User dasselbe Theme. Admins koennen
 *   es ueber PUT aendern (es wird in `app_settings.globalThemeId` gespeichert).
 * - Bei `themeScope === "per_user"` waehlt jeder eingeloggte User sein eigenes
 *   Theme; Nicht-Admins koennen das eigene Theme aendern.
 */
export async function getEffectiveThemeSnapshot(): Promise<ThemeSnapshot> {
  unstable_noStore()

  const coreStore = getCoreStore()
  const tenantSlug = getTenantSlug()

  const { userId } = await auth({ treatPendingAsSignedOut: false })

  const [themeRegistry, themeState, appSettings] = await Promise.all([
    coreStore.listThemeRegistry(),
    userId ? coreStore.getUserThemeState(userId) : Promise.resolve(null),
    coreStore.getAppSettings(tenantSlug),
  ])

  const themes: ThemeMeta[] = themeRegistry.map(coreThemeToMeta)

  const isAuthenticated = !!userId
  const isAdmin = themeState?.isAdmin ?? false
  const themeScope = resolveThemeScope(appSettings)
  const canManageAppTheme = isAdmin
  // Im global-Modus darf nur der Admin sein Theme aendern; im per_user-Modus
  // jeder eingeloggte User. Color-Scheme bleibt davon unberuehrt (siehe PUT).
  const canSelectTheme = themeScope === "global" ? isAdmin : isAuthenticated

  let activeThemeId: string
  if (themeScope === "global") {
    // App-weites Theme — bevorzugt aus app_settings, sonst Backward-Compat
    // ueber das Theme des ersten Admin-Users.
    if (appSettings?.globalThemeId) {
      activeThemeId = appSettings.globalThemeId
    } else {
      const allUsers = await coreStore.listUsers()
      const adminUser = allUsers.find((u) => isAdminRole(u.role))
      const adminThemeState = adminUser
        ? await coreStore.getUserThemeState(adminUser.clerkUserId)
        : null
      activeThemeId = adminThemeState?.theme || themeState?.theme || DEFAULT_THEME_ID
    }
  } else {
    activeThemeId = themeState?.theme || DEFAULT_THEME_ID
  }

  // Color-Scheme (Dark/Light/System) ist eine persoenliche User-Praeferenz und wird
  // nicht vom Admin vererbt. Nicht eingeloggte User fallen auf "system" zurueck.
  const colorScheme = normalizeColorScheme(themeState?.colorScheme)

  const themeExists = themes.some((t) => t.id === activeThemeId)
  if (!themeExists) {
    activeThemeId = DEFAULT_THEME_ID
  }

  const cssText = await resolveThemeCss(activeThemeId)
  const cornerStyle = extractCornerStyleFromCss(activeThemeId, cssText)

  return {
    activeThemeId,
    theme: activeThemeId,
    themes,
    cssText,
    colorScheme,
    cornerStyle,
    canManageAppTheme,
    canSelectTheme,
    isAdmin,
    isAuthenticated,
    themeScope,
    usingAdminTheme: themeScope === "global" && isAuthenticated && !isAdmin,
  }
}
