#!/usr/bin/env node

/**
 * Vollständiges Setup-Script
 * Führt alle notwendigen Schritte aus:
 * 1. Migrationen prüfen/pushen
 * 2. Test-User anlegen
 * 3. Auth konfigurieren
 * 4. Setup verifizieren
 */

import { execSync } from "child_process"
import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log("🚀 Vollständiges Setup startet...\n")

// 1. Prüfe Environment-Variablen
console.log("1️⃣ Prüfe Environment-Variablen...")
const envPath = join(__dirname, "..", ".env.local")
if (!existsSync(envPath)) {
  console.error("❌ .env.local nicht gefunden! Bitte führe zuerst `pnpm pull-env` aus.")
  process.exit(1)
}

const envContent = readFileSync(envPath, "utf-8")
const hasSupabaseUrl = envContent.includes("NEXT_PUBLIC_SUPABASE_URL")
const hasAnonKey = envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const hasServiceRole = envContent.includes("SUPABASE_SERVICE_ROLE_KEY")

if (!hasSupabaseUrl || !hasAnonKey || !hasServiceRole) {
  console.error("❌ Fehlende Environment-Variablen in .env.local!")
  console.error("   Bitte führe `pnpm pull-env` aus.")
  process.exit(1)
}

console.log("   ✅ Environment-Variablen vorhanden\n")

// 2. Prüfe Migrationen
console.log("2️⃣ Prüfe Migrationen...")
try {
  const migrationOutput = execSync("npx supabase migration list", {
    cwd: join(__dirname, ".."),
    encoding: "utf-8",
    stdio: "pipe",
  })

  const localMigrations = (migrationOutput.match(/001|002|003|004/g) || []).length
  console.log(`   ✅ ${localMigrations} Migrationen gefunden`)

  if (localMigrations < 4) {
    console.log("   ⚠️  Nicht alle Migrationen gefunden")
  }
} catch (error) {
  console.error("   ❌ Fehler beim Prüfen der Migrationen:", error.message)
}

console.log("")

// 3. Migrationen pushen
console.log("3️⃣ Pushe Migrationen...")
try {
  execSync("npx supabase db push", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  })
  console.log("   ✅ Migrationen erfolgreich gepusht\n")
} catch (error) {
  console.error("   ❌ Fehler beim Pushen der Migrationen:", error.message)
  process.exit(1)
}

// 4. Test-User anlegen
console.log("4️⃣ Lege Test-User an...")
try {
  execSync("node scripts/create-test-users.mjs", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  })
  console.log("   ✅ Test-User angelegt\n")
} catch (error) {
  console.error("   ❌ Fehler beim Anlegen der Test-User:", error.message)
  process.exit(1)
}

// 5. Auth konfigurieren
console.log("5️⃣ Konfiguriere Auth...")
try {
  execSync("node scripts/setup-auth-config.mjs", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  })
  console.log("   ✅ Auth konfiguriert\n")
} catch (error) {
  console.error("   ⚠️  Warnung beim Konfigurieren der Auth:", error.message)
}

// 6. Email-Bestätigung deaktivieren
console.log("6️⃣ Deaktiviere Email-Bestätigung...")
try {
  execSync("node scripts/disable-email-confirmation.mjs", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  })
  console.log("   ✅ Email-Bestätigung deaktiviert\n")
} catch (error) {
  console.error("   ⚠️  Warnung beim Deaktivieren der Email-Bestätigung:", error.message)
}

// 7. Setup verifizieren
console.log("7️⃣ Verifiziere Setup...")
try {
  execSync("node scripts/verify-setup.mjs", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  })
} catch (error) {
  console.error("   ❌ Fehler bei der Verifizierung:", error.message)
  process.exit(1)
}

console.log("\n" + "=".repeat(60))
console.log("✅ Setup abgeschlossen!")
console.log("=".repeat(60))
console.log("\n📋 Test-User Credentials:")
console.log("   Admin: admin@kessel.local / Admin123!")
console.log("   User:  user@kessel.local / User123!")
console.log("   Test:  test@kessel.local / Test123!")
console.log("\n🚀 Starte den Dev-Server mit: pnpm dev")
console.log("")
