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

// ═══════════════════════════════════════════════════════════════════════════
// PRESERVED VARIABLES
// Diese Variablen werden aus der bestehenden .env.local erhalten und nicht
// überschrieben. Sie werden von der CLI bei der Projekt-Erstellung gesetzt.
// ═══════════════════════════════════════════════════════════════════════════
const PRESERVED_VAR_PREFIXES = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_TENANT_SLUG",
  "NEXT_PUBLIC_DEV_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]

/**
 * Liest bestehende .env.local und extrahiert Variablen die erhalten bleiben sollen
 */
function getPreservedVariables(envPath) {
  const preserved = {}

  if (!fs.existsSync(envPath)) {
    return preserved
  }

  try {
    const content = fs.readFileSync(envPath, "utf-8")
    const lines = content.split("\n")

    for (const line of lines) {
      // Ignoriere Kommentare und leere Zeilen
      if (line.startsWith("#") || !line.includes("=")) continue

      const [key, ...valueParts] = line.split("=")
      const trimmedKey = key.trim()
      const value = valueParts.join("=").trim()

      // Prüfe ob diese Variable erhalten bleiben soll
      if (PRESERVED_VAR_PREFIXES.some((prefix) => trimmedKey.startsWith(prefix))) {
        // Entferne Anführungszeichen falls vorhanden
        preserved[trimmedKey] = value.replace(/^["']|["']$/g, "")
      }
    }
  } catch (e) {
    // Ignoriere Lesefehler
  }

  return preserved
}

async function run() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local")

    // 1. Bestehende projektspezifische Variablen erhalten
    const preservedVars = getPreservedVariables(envPath)
    const hasPreservedVars = Object.keys(preservedVars).length > 0

    if (hasPreservedVars) {
      log(chalk.cyan("📋 Bestehende Projekt-Variablen werden erhalten:\n"))
      for (const [key, value] of Object.entries(preservedVars)) {
        const displayValue =
          key.includes("KEY") || key.includes("SECRET") ? `${value.substring(0, 10)}...` : value
        log(chalk.gray(`   ${key}=${displayValue}`))
      }
      log("")
    }

    // 2. Secrets aus Vault laden
    log(chalk.blue("🔐 Rufe Secrets aus dem Supabase Vault ab...\n"))
    const secrets = await fetchSecretsFromSupabase()

    // 3. Vault-Secrets formatieren
    const vaultEnvLines = Object.entries(secrets).map(
      ([key, value]) => `${key}=${String(value).includes(" ") ? `"${value}"` : value}`
    )

    // 4. Erhaltene Variablen formatieren
    const preservedEnvLines = Object.entries(preservedVars).map(
      ([key, value]) => `${key}=${String(value).includes(" ") ? `"${value}"` : value}`
    )

    // 5. Local Dev Defaults hinzufügen
    const devDefaultsLines = Object.entries(LOCAL_DEV_DEFAULTS).map(
      ([key, value]) => `${key}=${value}`
    )

    // 6. Alles zusammenfügen mit Kommentar-Sektionen
    const sections = []

    // Projekt-Konfiguration (erhaltene Variablen)
    if (preservedEnvLines.length > 0) {
      sections.push(
        "# ════════════════════════════════════════════════════════════════════",
        "# Projekt-Konfiguration (von CLI generiert, bleibt erhalten)",
        "# ════════════════════════════════════════════════════════════════════",
        ...preservedEnvLines,
        ""
      )
    }

    // Vault-Secrets
    sections.push(
      "# ════════════════════════════════════════════════════════════════════",
      "# Secrets aus Supabase Vault (via pnpm pull-env)",
      "# ════════════════════════════════════════════════════════════════════",
      ...vaultEnvLines,
      "",
      "# ════════════════════════════════════════════════════════════════════",
      "# Local Development Defaults (automatisch hinzugefügt)",
      "# ════════════════════════════════════════════════════════════════════",
      ...devDefaultsLines,
      "" // Trailing newline
    )

    const envFileContent = sections.join("\n")

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
