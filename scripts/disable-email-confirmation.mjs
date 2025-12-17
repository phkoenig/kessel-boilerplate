#!/usr/bin/env node

/**
 * Script zum Deaktivieren der Email-Bestätigung über Supabase Management API
 */

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
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL) {
  console.error("Fehler: NEXT_PUBLIC_SUPABASE_URL nicht gefunden")
  process.exit(1)
}

// Extrahiere Project Reference aus URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error("Fehler: Konnte Project Reference nicht aus URL extrahieren")
  process.exit(1)
}

console.log(`🔧 Deaktiviere Email-Bestätigung für Projekt: ${projectRef}\n`)

// Supabase Management API Endpoint
const MANAGEMENT_API_URL = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`

async function disableEmailConfirmation() {
  try {
    // Prüfe aktuelle Konfiguration
    console.log("📋 Aktuelle Auth-Konfiguration abrufen...")

    const response = await fetch(MANAGEMENT_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Fehler beim Abrufen der Konfiguration: ${response.status}`)
      console.error(`   ${errorText}`)
      console.log("\n💡 Alternative: Deaktiviere Email-Bestätigung manuell im Supabase Dashboard:")
      console.log('   Authentication > Settings > Email Auth > "Confirm email" deaktivieren\n')
      return
    }

    // Response als JSON lesen (Validierung dass API funktioniert)
    await response.json()
    console.log("✅ Konfiguration abgerufen\n")

    // Update Auth Config - deaktiviere Email-Bestätigung
    console.log("🔧 Deaktiviere Email-Bestätigung...")

    const updateResponse = await fetch(MANAGEMENT_API_URL, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enable_signup: true,
        enable_confirmations: false, // Email-Bestätigung deaktivieren
      }),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error(`❌ Fehler beim Aktualisieren: ${updateResponse.status}`)
      console.error(`   ${errorText}`)
      console.log("\n💡 Alternative: Deaktiviere Email-Bestätigung manuell im Supabase Dashboard:")
      console.log('   Authentication > Settings > Email Auth > "Confirm email" deaktivieren\n')
      return
    }

    console.log("✅ Email-Bestätigung erfolgreich deaktiviert!\n")
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    console.log("\n💡 Alternative: Deaktiviere Email-Bestätigung manuell im Supabase Dashboard:")
    console.log('   Authentication > Settings > Email Auth > "Confirm email" deaktivieren\n')
  }
}

disableEmailConfirmation()
