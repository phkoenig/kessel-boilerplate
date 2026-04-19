// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// 1. Server-Schema definieren UND EXPORTIEREN
//    Supabase-bezogene Vars sind seit Plan H1 alle optional — der
//    Boilerplate-Kern laeuft ohne Supabase. Nur die optionalen
//    Beispiel-Features (Bug-Report, Feature-Wishlist, Datenquellen)
//    benoetigen sie.
export const serverSchema = z.object({
  SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  FAL_API_KEY: z.string().optional(),
  // Clerk — Pflicht fuer Boilerplate 3.0 (Single-Tenant Identity)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),
})

// 2. Client-Schema definieren UND EXPORTIEREN
export const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_TENANT_SLUG: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // SpacetimeDB ist im finalen 3.0-Zustand Pflicht fuer den Boilerplate-Core.
  NEXT_PUBLIC_SPACETIMEDB_URI: z.string().min(1),
  NEXT_PUBLIC_SPACETIMEDB_DATABASE: z.string().min(1),
  NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER: z.literal("spacetime"),
})

// 3. Das kombinierte Schema für die Validierung im Skript
export const combinedSchema = serverSchema.merge(clientSchema)

// 4. Die 'env'-Variable wie gewohnt erstellen
export const env = createEnv({
  server: serverSchema.shape,
  client: clientSchema.shape,

  // Umgebungsvariablen für Next.js zur Laufzeit
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TENANT_SLUG: process.env.NEXT_PUBLIC_TENANT_SLUG,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SPACETIMEDB_URI: process.env.NEXT_PUBLIC_SPACETIMEDB_URI,
    NEXT_PUBLIC_SPACETIMEDB_DATABASE: process.env.NEXT_PUBLIC_SPACETIMEDB_DATABASE,
    NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER: process.env.NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER,
    SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  },

  // Validierung überspringen, falls in Build-Umgebungen (z.B. Vercel)
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
