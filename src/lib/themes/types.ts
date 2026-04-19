/**
 * Theme-System Typen.
 *
 * Zentrale Typ-Definitionen fuer das iryse-basierte Theme-System in kessel-boilerplate.
 * Wird vom ThemeProvider, ThemeStore, Snapshot-Server und API-Routen gemeinsam genutzt.
 */

/** Corner-Style Presets. Squircle wird nur in Chromium-basierten Browsern gerendert. */
export type CornerStyle = "rounded" | "squircle"

/** Color-Scheme (Light/Dark/System). */
export type ThemeColorScheme = "dark" | "light" | "system"

/** Theme-Metadaten (reduziert fuer Client). */
export interface ThemeMeta {
  id: string
  name: string
  description: string
  dynamicFonts: string[]
  isBuiltin: boolean
}

/** React-Context fuer `useTheme()` (ThemeStore / ThemeProviderNext). */
export interface ThemeContextValue {
  theme: string
  setTheme: (id: string, options?: { skipValidation?: boolean }) => void
  themes: ThemeMeta[]
  colorMode: string
  setColorMode: (mode: "light" | "dark" | "system") => void
  refreshThemes: () => Promise<ThemeMeta[]>
  isLoading: boolean
  cornerStyle: CornerStyle
  setCornerStyle: (style: CornerStyle) => void
  supportsSquircle: boolean
  refreshThemeCSS: () => Promise<boolean>
}

/**
 * Server-Snapshot des effektiven Theme-Zustands.
 *
 * Wird von `getEffectiveThemeSnapshot()` geliefert und entweder direkt im Root-Layout
 * an den ThemeProvider injiziert (Prime) oder via `GET /api/user/theme` geladen.
 */
export interface ThemeSnapshot {
  /** Aktuelle Theme-ID (Admin-Vorgabe fuer alle User). */
  activeThemeId: string
  /** Alias von activeThemeId (Abwaertskompatibilitaet). */
  theme: string
  /** Alle verfuegbaren Themes (Builtin + dynamisch). */
  themes: ThemeMeta[]
  /** Bereits aufgeloester CSS-Text (SSR-safe). null falls nicht geladen werden konnte. */
  cssText: string | null
  /** Color-Scheme (Admin-Vorgabe). */
  colorScheme: ThemeColorScheme
  /** Corner-Style (wird aus --corner-style des aktiven Themes extrahiert). */
  cornerStyle: CornerStyle
  /** Darf der User das App-Theme verwalten (nur Admins)? */
  canManageAppTheme: boolean
  /** Darf der User das Theme waehlen (nur Admins)? */
  canSelectTheme: boolean
  /** Ist der User Admin? */
  isAdmin: boolean
  /** Ist der User ueberhaupt authentifiziert? */
  isAuthenticated: boolean
  /** Zeigt der User gerade das Admin-Theme (statt eigene Auswahl)? */
  usingAdminTheme: boolean
}
