#!/usr/bin/env node
// scripts/pull-env.mjs

import fs from "fs"
import path from "path"
import { config } from "dotenv"
import chalk from "chalk"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

// WICHTIG: .env laden BEVOR wir irgendetwas anderes tun
config()

// Schema hier definieren, um den Side-Effect-Import von env.mjs zu vermeiden
const combinedSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

// Helper für die Ausgabe
const log = console.log
const error = (msg) => log(chalk.red.bold(msg))
const success = (msg) => log(chalk.green.bold(msg))

// Diese Funktion ruft die Secrets ab
async function fetchSecretsFromSupabase() {
  // SERVICE_ROLE_KEY wird aus der Umgebung des Entwicklers erwartet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY müssen in der Umgebung gesetzt sein."
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // Der RPC-Aufruf
  const { data, error: rpcError } = await supabaseAdmin.rpc("get_all_secrets_for_env")

  if (rpcError) {
    throw new Error(`RPC-Fehler beim Abrufen der Secrets: ${rpcError.message}`)
  }

  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL DEVELOPMENT DEFAULTS
// Diese Variablen werden automatisch hinzugefügt und sind NICHT im Vault gespeichert.
// Sie gelten nur für lokale Entwicklung.
// ═══════════════════════════════════════════════════════════════════════════
const LOCAL_DEV_DEFAULTS = {
  // Auth-Bypass aktiviert den DevUserSelector auf der Login-Seite
  NEXT_PUBLIC_AUTH_BYPASS: "true",
}

async function run() {
  try {
    // 1. Primäre Validierung (Konnektivität & SERVICE_ROLE_KEY)
    log(chalk.blue("🔐 Rufe Secrets aus dem Supabase Vault ab...\n"))
    const secrets = await fetchSecretsFromSupabase()

    // 2. Vault-Secrets formatieren
    const vaultEnvLines = Object.entries(secrets).map(
      ([key, value]) => `${key}=${String(value).includes(" ") ? `"${value}"` : value}`
    )

    // 3. Local Dev Defaults hinzufügen
    const devDefaultsLines = Object.entries(LOCAL_DEV_DEFAULTS).map(
      ([key, value]) => `${key}=${value}`
    )

    // 4. Alles zusammenfügen mit Kommentar-Sektion
    const envFileContent = [
      "# ════════════════════════════════════════════════════════════════════",
      "# Secrets aus Supabase Vault (via pnpm pull-env)",
      "# ════════════════════════════════════════════════════════════════════",
      ...vaultEnvLines,
      "",
      "# ════════════════════════════════════════════════════════════════════",
      "# Local Development Defaults (automatisch hinzugefügt)",
      "# ════════════════════════════════════════════════════════════════════",
      ...devDefaultsLines,
      "", // Trailing newline
    ].join("\n")

    const envPath = path.resolve(process.cwd(), ".env.local")

    // 5. Secrets in .env.local schreiben
    fs.writeFileSync(envPath, envFileContent)
    log(chalk.yellow("📝 .env.local erfolgreich geschrieben.\n"))
    log(chalk.magenta("🔧 Local Dev Defaults aktiviert: NEXT_PUBLIC_AUTH_BYPASS=true\n"))

    // --- BEGINN DER FAIL-FAST VALIDIERUNG ---

    // 3. Datei *erneut* laden, um Variablen zu isolieren
    const parsedEnv = config({ path: envPath }).parsed

    if (!parsedEnv) {
      throw new Error("Konnte .env.local nach dem Schreiben nicht parsen.")
    }

    // 4. Manuelle Zod-Validierung durchführen
    log(chalk.blue("✨ Führe Fail-Fast Zod-Validierung durch...\n"))
    combinedSchema.parse(parsedEnv)

    success("✅ Validierung erfolgreich! Alle erforderlichen Secrets sind vorhanden und gültig.\n")
    log(chalk.cyan("🚀 Dein lokales Setup ist bereit. Starte mit `pnpm dev`.\n"))
  } catch (err) {
    error("\n❌ --- SETUP FEHLGESCHLAGEN (FAIL-FAST) ---\n")

    if (err.name === "ZodError") {
      error("⚠️  Die Secrets im Supabase Vault sind ungültig oder unvollständig.\n")
      log(chalk.red("Folgende Fehler wurden gefunden:\n"))
      err.errors.forEach((e) => {
        log(chalk.red(`  • Variable: ${e.path.join(".")}, Problem: ${e.message}`))
      })
      log(
        chalk.yellow(
          "\n💡 Aktion: Bitte korrigiere die Secrets im Vault und führe das Skript erneut aus.\n"
        )
      )
    } else {
      error("⚠️  Ein unerwarteter Fehler ist aufgetreten:\n")
      log(chalk.red(err.message + "\n"))
    }

    // Aufräumen: Die fehlerhafte .env.local entfernen
    const envPath = path.resolve(process.cwd(), ".env.local")
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath)
      log(chalk.yellow("🧹 Fehlerhafte .env.local wurde entfernt.\n"))
    }

    process.exit(1) // Wichtig: Prozess mit Fehler beenden
  }
}

run()
