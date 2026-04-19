/**
 * Server-Snapshot des effektiven Theme-Zustands.
 *
 * Architektur (aus iryse portiert):
 *   Es gibt **ein** globales Brand-Theme + Color-Scheme fuer ALLE User. Der Server
 *   bestimmt den aktiven Zustand anhand des ersten Admin-Users; `PUT /api/user/theme`
 *   synchronisiert Aenderungen auf alle Admin-Profile, damit der Snapshot unabhaengig
 *   von der DB-Iterationsreihenfolge konsistent ist.
 *
 * Diese Funktion ist Server-only (nutzt unstable_noStore, Clerk-auth und den
 * Supabase-Service-Client).
 */

import { unstable_noStore } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { isAdminRole } from "@/lib/auth/provisioning-role"
import { getCoreStore } from "@/lib/core"
import { createServiceClient } from "@/utils/supabase/service"
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
 * Liefert den effektiven Theme-Snapshot fuer den aktuellen User.
 *
 * - Nicht eingeloggte User bekommen Default-Theme + system-ColorScheme.
 * - Eingeloggte Nicht-Admins bekommen das aktuelle Admin-Theme (usingAdminTheme=true).
 * - Admins sehen ihre eigene Auswahl und koennen sie ueber PUT aendern.
 */
export async function getEffectiveThemeSnapshot(): Promise<ThemeSnapshot> {
  unstable_noStore()

  const coreStore = getCoreStore()

  const { userId } = await auth({ treatPendingAsSignedOut: false })

  const [themeRegistry, themeState, allUsers] = await Promise.all([
    coreStore.listThemeRegistry(),
    userId ? coreStore.getUserThemeState(userId) : Promise.resolve(null),
    coreStore.listUsers(),
  ])

  const themes: ThemeMeta[] = themeRegistry.map(coreThemeToMeta)

  const isAuthenticated = !!userId
  const isAdmin = themeState?.isAdmin ?? false
  const canManageAppTheme = isAdmin
  const canSelectTheme = isAdmin

  // Global: Admin-Theme wird als Vorgabe fuer alle User verwendet.
  const adminUser = allUsers.find((u) => isAdminRole(u.role))
  const adminThemeState = adminUser
    ? await coreStore.getUserThemeState(adminUser.clerkUserId)
    : null

  let activeThemeId = adminThemeState?.theme || themeState?.theme || DEFAULT_THEME_ID
  // Color-Scheme (Dark/Light/System) ist eine persoenliche User-Praeferenz und wird
  // nicht vom Admin vererbt. Nicht eingeloggte User fallen auf "system" zurueck.
  const colorScheme = normalizeColorScheme(themeState?.colorScheme)

  const themeExists = themes.some((t) => t.id === activeThemeId)
  if (!themeExists) {
    activeThemeId = DEFAULT_THEME_ID
  }

  const supabase = createServiceClient()
  const cssText = await resolveThemeCss(supabase, activeThemeId)
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
    usingAdminTheme: isAuthenticated && !isAdmin && !canSelectTheme,
  }
}
