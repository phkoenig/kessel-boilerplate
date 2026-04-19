// src/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Erstellt einen Supabase-Client für Server-Umgebung.
 *
 * Multi-Tenant: Tenant-Isolation erfolgt über RLS Policies basierend auf tenant_id im JWT.
 * Keine Schema-Option mehr nötig - alle Tabellen sind im public Schema.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. This feature requires NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (oder NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    )
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Die `set` Methode wurde wahrscheinlich von einer Server Action
          // oder Route Handler aufgerufen, die keine Cookies setzen können.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // Die `delete` Methode wurde wahrscheinlich von einer Server Action
          // oder Route Handler aufgerufen, die keine Cookies setzen können.
        }
      },
    },
  })
}
