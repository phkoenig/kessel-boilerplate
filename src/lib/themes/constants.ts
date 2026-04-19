/**
 * Theme-System Konstanten.
 */

/**
 * Default-Theme-ID. Kann ueber NEXT_PUBLIC_DEFAULT_THEME ueberschrieben werden.
 */
export const DEFAULT_THEME_ID = process.env.NEXT_PUBLIC_DEFAULT_THEME || "default"

/**
 * Realtime-Topic fuer Theme-Snapshot-Broadcasts (z.B. nach Admin-Aenderung).
 */
export const THEME_SNAPSHOT_TOPIC = "theme:snapshot"

/**
 * Feature-Flag: Steuert Nutzung des neuen Theme-Systems (Server-Snapshot + ThemeStore).
 *
 * - `true`  — ThemeProvider verwendet ThemeStore + /api/user/theme-Snapshot (iryse-basiert)
 * - `false` — Legacy-Flow aus theme-provider.tsx bleibt aktiv (Fallback)
 *
 * Wird nach erfolgreicher Rollout-Phase entfernt.
 */
export const IS_NEW_THEME_SYSTEM_ENABLED =
  process.env.NEXT_PUBLIC_FEATURE_NEW_THEME === "true" ||
  process.env.NEXT_PUBLIC_FEATURE_NEW_THEME === "1"
