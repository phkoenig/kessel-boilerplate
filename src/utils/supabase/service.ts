/**
 * Supabase Service Client
 *
 * Verwendet den Service-Role-Key fuer System-Operationen.
 * ACHTUNG: Umgeht RLS komplett - nur fuer Server-seitige System-Tasks!
 *
 * Anwendungsfaelle:
 * - Profil-Lookup/Provisioning (Clerk User -> profiles)
 * - Webhook-Verarbeitung
 * - Admin-APIs
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
      "NEXT_PUBLIC_SUPABASE_URL und (SUPABASE_SERVICE_ROLE_KEY oder SERVICE_ROLE_KEY) muessen gesetzt sein"
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
