// src/utils/supabase/client.ts
// Browser-Client mit @supabase/ssr für konsistentes Cookie-Handling
import { createBrowserClient } from "@supabase/ssr"

/**
 * Erstellt einen Supabase-Client für Browser-Umgebung.
 *
 * Verwendet @supabase/ssr für konsistentes Cookie-basiertes Session-Management
 * zwischen Browser und Server (proxy.ts).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
