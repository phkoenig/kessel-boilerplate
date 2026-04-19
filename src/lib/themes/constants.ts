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
