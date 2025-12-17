#!/usr/bin/env node

/**
 * Prüft die Rolle eines Users in der Datenbank
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local")
    const envContent = readFileSync(envPath, "utf-8")
    const env = {}

    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim()
      }
    })

    return env
  } catch (error) {
    console.error("Fehler beim Laden von .env.local:", error.message)
    process.exit(1)
  }
}

const env = loadEnv()

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Fehler: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gefunden")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkUserRole() {
  console.log("🔍 Prüfe User-Rolle für admin@kessel.local...\n")

  // 1. Finde User in Auth
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error("❌ Fehler beim Laden der User:", usersError.message)
    return
  }

  const adminUser = users?.users?.find((u) => u.email === "admin@kessel.local")

  if (!adminUser) {
    console.error("❌ User admin@kessel.local nicht gefunden!")
    return
  }

  console.log("✅ User gefunden:")
  console.log(`   ID: ${adminUser.id}`)
  console.log(`   Email: ${adminUser.email}`)
  console.log(`   Metadata role: ${adminUser.user_metadata?.role || "nicht gesetzt"}\n`)

  // 2. Prüfe Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, display_name")
    .eq("id", adminUser.id)
    .single()

  if (profileError) {
    console.error("❌ Fehler beim Laden des Profiles:", profileError.message)
    return
  }

  console.log("✅ Profile gefunden:")
  console.log(`   ID: ${profile.id}`)
  console.log(`   Email: ${profile.email}`)
  console.log(`   Role: ${profile.role}`)
  console.log(`   Display Name: ${profile.display_name || "nicht gesetzt"}\n`)

  if (profile.role === "admin") {
    console.log('✅ Rolle ist korrekt auf "admin" gesetzt!')
  } else {
    console.log(`⚠️  Rolle ist "${profile.role}", sollte aber "admin" sein!`)
    console.log("   Aktualisiere Rolle...")

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", adminUser.id)

    if (updateError) {
      console.error("❌ Fehler beim Aktualisieren:", updateError.message)
    } else {
      console.log('✅ Rolle erfolgreich auf "admin" aktualisiert!')
    }
  }
}

checkUserRole().catch((error) => {
  console.error("Fataler Fehler:", error)
  process.exit(1)
})
