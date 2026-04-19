/**
 * Theme System — nur iryse/ThemeStore-Pfad (kein Legacy-Feature-Flag).
 */

export { ThemeProviderNext as ThemeProvider, useTheme } from "./theme-provider-next"
export { DEFAULT_THEME_ID, THEME_SNAPSHOT_TOPIC } from "./constants"
export type {
  ThemeColorScheme,
  ThemeSnapshot,
  ThemeContextValue,
  ThemeMeta,
  CornerStyle,
} from "./types"
