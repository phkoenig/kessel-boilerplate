#!/usr/bin/env node
/**
 * Backfill: Bestehende Supabase-Auth-User mit clerk_user_id versehen
 *
 * Wird benoetigt wenn von Supabase Auth auf Clerk migriert wird.
 * Voraussetzung: Parallel-Import der User in Clerk (manuell oder via Clerk API).
 *
 * Usage:
 *   node scripts/backfill-clerk-profiles.mjs --dry-run
 *   node scripts/backfill-clerk-profiles.mjs --apply
 *
 * Mapping: profiles.email -> Clerk User Lookup -> clerk_user_id setzen
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const clerkSecretKey = process.env.CLERK_SECRET_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY muessen gesetzt sein")
  process.exit(1)
}

const dryRun = process.argv.includes("--dry-run")
const doApply = process.argv.includes("--apply")

if (!dryRun && !doApply) {
  console.log("Usage: node scripts/backfill-clerk-profiles.mjs [--dry-run|--apply]")
  console.log("  --dry-run: Zeigt Aenderungen an ohne zu schreiben")
  console.log("  --apply:  Fuehrt Backfill aus")
  process.exit(1)
}

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, clerk_user_id")
    .is("clerk_user_id", null)

  if (error) {
    console.error("Fehler beim Laden der Profile:", error.message)
    process.exit(1)
  }

  console.log(`Gefunden: ${profiles?.length ?? 0} Profile ohne clerk_user_id`)

  if (!profiles?.length) {
    console.log("Keine Aenderungen noetig.")
    return
  }

  if (!clerkSecretKey && doApply) {
    console.error("CLERK_SECRET_KEY erforderlich fuer --apply (Clerk API Lookup)")
    process.exit(1)
  }

  if (dryRun) {
    console.log("DRY-RUN: Folgende Profile wuerden aktualisiert:")
    profiles.forEach((p) => console.log(`  - ${p.email} (${p.id})`))
    console.log("\nFuehre mit --apply aus, nachdem User in Clerk importiert wurden.")
    return
  }

  // Mit --apply: Clerk API aufrufen um E-Mail -> clerk_user_id zu mappen
  // Hier nur Platzhalter - vollstaendige Implementierung braucht Clerk Backend API
  console.log("--apply: Clerk-Backend-Lookup noetig. Siehe Clerk Migrations-Docs.")
  console.log("https://clerk.com/docs/migration/overview")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
