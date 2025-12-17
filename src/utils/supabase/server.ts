// src/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Verwende ANON_KEY (Standard Supabase Variable) mit Fallback auf PUBLISHABLE_KEY
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    }
  )
}
