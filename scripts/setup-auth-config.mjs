#!/usr/bin/env node

/**
 * Script zum Setup der Auth-Konfiguration
 *
 * 1. Setzt Rollen in profiles-Tabelle korrekt
 * 2. Deaktiviert Email-Bestätigung für Development
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade Environment-Variablen
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
  console.error("Fehler: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gefunden")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupAuthConfig() {
  console.log("🔧 Setup Auth-Konfiguration...\n")

  // 1. Rollen in profiles-Tabelle korrigieren
  console.log("1️⃣ Setze Rollen in profiles-Tabelle...")

  const users = [
    { email: "admin@kessel.local", role: "admin" },
    { email: "user@kessel.local", role: "user" },
    { email: "test@kessel.local", role: "user" },
  ]

  for (const user of users) {
    // Finde User-ID über auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u) => u.email === user.email)

    if (authUser) {
      // Aktualisiere Rolle in profiles
      const { error } = await supabase
        .from("profiles")
        .update({ role: user.role })
        .eq("id", authUser.id)

      if (error) {
        console.error(`   ⚠️  Fehler bei ${user.email}: ${error.message}`)
      } else {
        console.log(`   ✅ ${user.email} → Rolle: ${user.role}`)
      }
    } else {
      console.log(`   ⚠️  User ${user.email} nicht gefunden`)
    }
  }

  console.log("\n2️⃣ Email-Bestätigung deaktivieren...")
  console.log(
    "   ⚠️  Hinweis: Email-Bestätigung muss manuell im Supabase Dashboard deaktiviert werden:"
  )
  console.log('      Authentication > Settings > Email Auth > "Confirm email" deaktivieren')
  console.log('      Oder: Authentication > Providers > Email > "Confirm email" deaktivieren\n')

  // 2. Versuche über Management API (falls verfügbar)
  // Die Supabase Management API erfordert einen Access Token
  // Für jetzt geben wir nur Hinweise

  console.log("✅ Setup abgeschlossen!\n")
}

setupAuthConfig().catch((error) => {
  console.error("Fataler Fehler:", error)
  process.exit(1)
})
