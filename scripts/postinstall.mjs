#!/usr/bin/env node
/**
 * Postinstall Script
 *
 * Führt automatisch `pnpm pull-env` aus, um Secrets aus dem Vault zu laden.
 * Nur wenn .env existiert (= Bootstrap-Credentials vorhanden).
 *
 * Dieses Script stellt sicher, dass nach `pnpm install` alle API-Keys
 * automatisch aus dem Supabase Vault geladen werden.
 */

import fs from "fs"
import { execSync } from "child_process"
import path from "path"

const envPath = path.resolve(process.cwd(), ".env")

// Prüfe ob .env existiert (Bootstrap-Credentials)
if (!fs.existsSync(envPath)) {
  console.log("")
  console.log("⚠️  Keine .env Datei gefunden.")
  console.log("   Das ist normal bei der ersten Installation.")
  console.log("")
  console.log("   📋 Nächste Schritte:")
  console.log("   1. Erstelle .env mit NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY")
  console.log("   2. Führe 'pnpm pull-env' aus, um Secrets aus dem Vault zu laden")
  console.log("   3. Starte den Dev-Server mit 'pnpm dev'")
  console.log("")
  process.exit(0)
}

// .env existiert → führe pull-env aus
console.log("")
console.log("📦 .env gefunden - lade Secrets aus Supabase Vault...")
console.log("")

try {
  execSync("pnpm pull-env", { stdio: "inherit" })
  console.log("")
  console.log("✅ Secrets erfolgreich geladen!")
  console.log("")
} catch (error) {
  console.log("")
  console.log("⚠️  pull-env fehlgeschlagen (nicht kritisch).")
  console.log("   Du kannst später manuell 'pnpm pull-env' ausführen.")
  console.log("")
  // Nicht mit Fehlercode beenden - Installation soll weitergehen
  process.exit(0)
}
