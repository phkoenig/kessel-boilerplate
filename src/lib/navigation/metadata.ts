import type { Metadata } from "next"

import { findNavigationItemByHref } from "./core-navigation"
import { NAVIGATION_SEED } from "./seed"

/**
 * Baut `metadata` (Next.js) für eine Shell-Route aus `NAVIGATION_SEED`.
 *
 * @param pathname - Aktueller Pfad, z. B. `/module-1/sub-1`
 * @returns `Metadata` mit `title` oder leeres Objekt, wenn keine passende Zeile existiert
 */
export function buildNavPageMetadata(pathname: string): Metadata {
  const current = findNavigationItemByHref(NAVIGATION_SEED, pathname)
  if (!current) {
    return {}
  }

  const label = current.sectionTitle ?? current.label
  return { title: label }
}
