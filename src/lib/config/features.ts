/**
 * Feature-Flags fuer die Boilerplate.
 *
 * Der Kern (Themes, Identity, App-Icons, Nav, Rollen) ist vollstaendig
 * Supabase-frei (Plan A-K, Boilerplate-DB-Agnostik). Bestimmte Beispiel-
 * Features (Bug-Report, Feature-Wishlist, Datenquellen-Demo) nutzen
 * Supabase als optionale App-DB.
 *
 * `isSupabaseExamplesEnabled` steuert, ob diese Beispiele beim Boot
 * aktiviert werden: Wenn `NEXT_PUBLIC_SUPABASE_URL` fehlt, liefern die
 * betroffenen Routen einen klar kommunizierten 503-Status und die Nav
 * blendet sie aus (Plan H3/I2).
 */

const isNonEmpty = (value: string | undefined | null): value is string =>
  typeof value === "string" && value.trim().length > 0

/**
 * True, wenn die optionalen Beispiel-Features mit Supabase-Abhaengigkeit
 * aktiviert werden duerfen. Wir pruefen nur die oeffentliche URL — das
 * reicht als Indikator: ohne URL laeuft auch kein Service-Client.
 */
export function isSupabaseExamplesEnabled(): boolean {
  return isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL)
}

/**
 * Navigations-IDs der Beispiel-Features, die Supabase benoetigen.
 *
 * Plan I2: Die Nav blendet diese Eintraege aus, wenn
 * `isSupabaseExamplesEnabled()` false ist. Muss in Sync mit
 * `src/lib/navigation/seed.ts` gehalten werden.
 */
export const SUPABASE_EXAMPLE_NAV_IDS: ReadonlySet<string> = new Set([
  "about-features",
  "about-bugs",
  "admin-datasources",
])
