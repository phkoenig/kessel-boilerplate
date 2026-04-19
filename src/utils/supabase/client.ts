// src/utils/supabase/client.ts
// Browser-Client mit @supabase/ssr fuer konsistentes Cookie-Handling.
//
// Plan H1: Supabase ist im Boilerplate-Kern optional. Diese Factory wirft
// einen klaren Fehler, wenn Supabase nicht konfiguriert ist.
import { createBrowserClient } from "@supabase/ssr"

/**
 * Erstellt einen Supabase-Client fuer Browser-Umgebung.
 *
 * Nur fuer optionale App-Beispiel-Features (Bug-Report, Feature-Wishlist etc.).
 * Nicht im Boilerplate-Kern verwenden — Identity laeuft ueber Clerk, Core-Daten
 * ueber Spacetime.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. This feature requires NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (oder NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    )
  }

  return createBrowserClient(url, key)
}
