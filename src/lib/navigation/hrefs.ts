import { NAVIGATION_SEED } from "./seed"

/**
 * Alle Nav-IDs aus dem statischen Seed (Spalte `id`).
 */
export type NavId = (typeof NAVIGATION_SEED)[number]["id"]

/**
 * Union aller im Seed definierten internen Pfade (`href` mit String).
 * Abschnitte/Actions ohne `href` sind nicht Teil dieser Union.
 */
export type NavHref = Exclude<(typeof NAVIGATION_SEED)[number]["href"], null | undefined>

/**
 * Home der Shell — nicht als `href` im Seed modelliert, aber gültiges Shell-Ziel.
 */
export const SHELL_HOME_HREF = "/" as const
export type ShellHomeHref = typeof SHELL_HOME_HREF

/**
 * Interne Shell-Navigation: Seed-Routen plus Home.
 */
export type AppShellHref = NavHref | ShellHomeHref

/**
 * Lookup `nav_id` → `href` nur für Einträge mit gesetztem `href`.
 */
export const NAV_HREF: Partial<Record<NavId, NavHref>> = NAVIGATION_SEED.reduce(
  (acc, item) => {
    if (item.href != null) {
      acc[item.id] = item.href
    }
    return acc
  },
  {} as Partial<Record<NavId, NavHref>>
)

/**
 * Liefert den kanonischen Pfad für eine Seed-Nav-ID.
 *
 * @param id - Navigations-ID aus `NAVIGATION_SEED`
 * @returns zugehöriger `href`
 * @throws wenn die ID fehlt oder keinen `href` hat
 */
export function navTo(id: NavId): NavHref {
  const href = NAV_HREF[id]
  if (!href) {
    throw new Error(`navTo: Kein href für Nav-ID "${String(id)}"`)
  }
  return href
}

/** Externe oder nicht-Seed-Ziele (z. B. Clerk, API). */
export type ExternalHref = `http://${string}` | `https://${string}`
