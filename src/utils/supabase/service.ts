/**
 * Supabase Service Client
 *
 * Verwendet den Service-Role-Key fuer System-Operationen.
 * ACHTUNG: Umgeht RLS komplett - nur fuer Server-seitige System-Tasks!
 *
 * Seit Plan H1: Supabase ist im Boilerplate-Kern optional. Diese Factory
 * wirft einen klaren Fehler, wenn Supabase nicht konfiguriert ist — sie
 * gehoert zu den Beispiel-Features (`src/app/(shell)/(examples)/**`) bzw.
 * zur Migration (`scripts/migrations/**`) und darf nicht im Kern verwendet
 * werden.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Erstellt einen Supabase Client mit Service-Role-Rechten.
 * NIEMALS im Client/Browser verwenden!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. This feature requires NEXT_PUBLIC_SUPABASE_URL and " +
        "(SUPABASE_SERVICE_ROLE_KEY oder SERVICE_ROLE_KEY). Der Boilerplate-Kern laeuft " +
        "vollstaendig ohne Supabase — pruefe, ob dieser Aufruf aus einem optionalen " +
        "Beispiel-Feature kommt (siehe docs/12_plans/260419-boilerplate-db-agnostik.md)."
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
