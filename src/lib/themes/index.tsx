/**
 * Theme System Exports
 * ====================
 *
 * Zentrale Exports fuer das Theme-System.
 *
 * Feature-Flag-Umschaltung:
 *   - `IS_NEW_THEME_SYSTEM_ENABLED=true` → neuer iryse-basierter Provider
 *     (`ThemeProviderNext`, intern gegen ThemeStore + Server-Snapshot).
 *   - `false` (Default) → Legacy-Provider (`theme-provider.tsx`) mit localStorage.
 *
 * `useTheme()` hat in beiden Pfaden dieselbe Signatur, damit Konsumenten-Code
 * (theme-editor-context, Theme-Manager, CornerStyleSwitch, SaveThemeDialog, ...)
 * unveraendert bleibt.
 *
 * Nach Rollout-Abschluss (Plan F4) wird der Legacy-Pfad entfernt.
 */

import type { ReactNode } from "react"
import { IS_NEW_THEME_SYSTEM_ENABLED } from "./constants"
import { ThemeProvider as LegacyThemeProvider, useTheme as useLegacyTheme } from "./theme-provider"
import { ThemeProviderNext, useTheme as useNextTheme } from "./theme-provider-next"
import type { ThemeContextValue, ThemeMeta, CornerStyle } from "./theme-provider"
import type { ThemeSnapshot } from "./types"

export { DEFAULT_THEME_ID, THEME_SNAPSHOT_TOPIC, IS_NEW_THEME_SYSTEM_ENABLED } from "./constants"
export type { ThemeColorScheme, ThemeSnapshot } from "./types"
export type { ThemeContextValue, ThemeMeta, CornerStyle }

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
  /** Nur im neuen Provider genutzt. Server-Snapshot aus RSC-Layout. */
  initialSnapshot?: ThemeSnapshot | null
}

/**
 * Kombinierter Theme-Provider.
 *
 * Waehlt zur Build-Zeit (NEXT_PUBLIC_FEATURE_NEW_THEME) zwischen Legacy und Next.
 */
export function ThemeProvider({
  children,
  defaultTheme,
  initialSnapshot,
}: ThemeProviderProps): React.ReactElement {
  if (IS_NEW_THEME_SYSTEM_ENABLED) {
    return <ThemeProviderNext initialSnapshot={initialSnapshot}>{children}</ThemeProviderNext>
  }
  return <LegacyThemeProvider defaultTheme={defaultTheme}>{children}</LegacyThemeProvider>
}

/**
 * Hook fuer Theme-Zugriff. Bindet zur Modul-Ladezeit den passenden Provider-Hook,
 * damit React's Rules-of-Hooks eingehalten werden (keine runtime-Verzweigung).
 */
export const useTheme: () => ThemeContextValue = IS_NEW_THEME_SYSTEM_ENABLED
  ? useNextTheme
  : useLegacyTheme
