// src/utils/supabase/client.ts
// Browser-Client mit @supabase/ssr für konsistentes Cookie-Handling
import { createBrowserClient } from "@supabase/ssr"

/**
 * Erstellt einen Supabase-Client für Browser-Umgebung.
 *
 * Verwendet @supabase/ssr für konsistentes Cookie-basiertes Session-Management
 * zwischen Browser und Server (proxy.ts).
 *
 * Multi-Tenant: Tenant-Isolation erfolgt über RLS Policies basierend auf tenant_id im JWT.
 * Keine Schema-Option mehr nötig - alle Tabellen sind im public Schema.
 */
export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  return client
}
