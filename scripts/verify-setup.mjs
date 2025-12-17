#!/usr/bin/env node

/**
 * Script zur vollständigen Verifizierung des Setups
 * Prüft alle Tabellen, User, und Konfigurationen
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
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Fehler: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gefunden in .env.local"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log("🔍 Verifiziere Setup...\n")
console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`)

async function verifySetup() {
  const results = {
    tables: {},
    users: {},
    profiles: {},
    themes: {},
    storage: {},
  }

  // 1. Prüfe Tabellen
  console.log("📊 Prüfe Tabellen...")
  const tables = ["profiles", "themes", "user_interactions"]

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })

      if (error) {
        results.tables[table] = { exists: false, error: error.message }
        console.log(`   ❌ ${table}: ${error.message}`)
      } else {
        results.tables[table] = { exists: true, count: count || 0 }
        console.log(`   ✅ ${table}: ${count || 0} Einträge`)
      }
    } catch (error) {
      results.tables[table] = { exists: false, error: error.message }
      console.log(`   ❌ ${table}: ${error.message}`)
    }
  }

  // 2. Prüfe Auth Users
  console.log("\n👤 Prüfe Auth Users...")
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (error) {
      console.log(`   ❌ Fehler: ${error.message}`)
      results.users.error = error.message
    } else {
      const testUsers = users?.users?.filter((u) => u.email?.includes("@kessel.local")) || []
      results.users.count = users?.users?.length || 0
      results.users.testUsers = testUsers.length
      console.log(`   ✅ Gesamt: ${users?.users?.length || 0} User`)
      console.log(`   ✅ Test-User: ${testUsers.length}`)

      testUsers.forEach((user) => {
        console.log(`      - ${user.email} (${user.id})`)
      })
    }
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`)
    results.users.error = error.message
  }

  // 3. Prüfe Profiles
  console.log("\n📋 Prüfe Profiles...")
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, role, display_name")

    if (error) {
      console.log(`   ❌ Fehler: ${error.message}`)
      results.profiles.error = error.message
    } else {
      results.profiles.count = profiles?.length || 0
      console.log(`   ✅ Gesamt: ${profiles?.length || 0} Profile`)

      profiles?.forEach((profile) => {
        console.log(`      - ${profile.email} (${profile.role})`)
      })
    }
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`)
    results.profiles.error = error.message
  }

  // 4. Prüfe Themes
  console.log("\n🎨 Prüfe Themes...")
  try {
    const { data: themes, error } = await supabase.from("themes").select("id, name")

    if (error) {
      console.log(`   ❌ Fehler: ${error.message}`)
      results.themes.error = error.message
    } else {
      results.themes.count = themes?.length || 0
      console.log(`   ✅ Gesamt: ${themes?.length || 0} Themes`)

      themes?.forEach((theme) => {
        console.log(`      - ${theme.name} (${theme.id})`)
      })
    }
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`)
    results.themes.error = error.message
  }

  // 5. Prüfe Storage Bucket
  console.log("\n📦 Prüfe Storage Bucket...")
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.log(`   ❌ Fehler: ${error.message}`)
      results.storage.error = error.message
    } else {
      const themesBucket = buckets?.find((b) => b.id === "themes")
      if (themesBucket) {
        results.storage.themesBucket = true
        console.log(`   ✅ Themes Bucket existiert`)

        // Prüfe Dateien im Bucket
        const { data: files, error: filesError } = await supabase.storage.from("themes").list()

        if (!filesError && files) {
          console.log(`   ✅ ${files.length} Theme-Dateien im Bucket`)
          files.forEach((file) => {
            console.log(`      - ${file.name}`)
          })
        }
      } else {
        results.storage.themesBucket = false
        console.log(`   ⚠️  Themes Bucket fehlt`)
      }
    }
  } catch (error) {
    console.log(`   ❌ Fehler: ${error.message}`)
    results.storage.error = error.message
  }

  // Zusammenfassung
  console.log("\n" + "=".repeat(60))
  console.log("📋 ZUSAMMENFASSUNG")
  console.log("=".repeat(60))

  const allGood =
    results.tables.profiles?.exists &&
    results.tables.themes?.exists &&
    results.tables.user_interactions?.exists &&
    results.users.testUsers >= 3 &&
    results.profiles.count >= 3 &&
    results.storage.themesBucket

  if (allGood) {
    console.log("\n✅ Alles sieht gut aus! Setup ist vollständig.")
  } else {
    console.log("\n⚠️  Einige Probleme gefunden:")
    if (!results.tables.profiles?.exists) console.log("   - profiles Tabelle fehlt")
    if (!results.tables.themes?.exists) console.log("   - themes Tabelle fehlt")
    if (!results.tables.user_interactions?.exists)
      console.log("   - user_interactions Tabelle fehlt")
    if (results.users.testUsers < 3)
      console.log(`   - Nur ${results.users.testUsers}/3 Test-User gefunden`)
    if (results.profiles.count < 3)
      console.log(`   - Nur ${results.profiles.count}/3 Profile gefunden`)
    if (!results.storage.themesBucket) console.log("   - Themes Storage Bucket fehlt")
  }

  return results
}

verifySetup().catch((error) => {
  console.error("Fataler Fehler:", error)
  process.exit(1)
})
