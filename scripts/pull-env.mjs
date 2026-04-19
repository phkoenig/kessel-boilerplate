#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"
import { config } from "dotenv"
import chalk from "chalk"
import { z } from "zod"

config()

const manifestSchema = z.object({
  entries: z.array(
    z.object({
      envName: z.string().min(1),
      source: z.enum(["bootstrap", "1password"]),
      bootstrapEnvName: z.string().optional(),
      opReference: z.string().optional(),
      opReferenceEnvName: z.string().optional(),
      required: z.boolean().default(true),
      vercel: z.boolean().optional(),
      description: z.string().optional(),
    })
  ),
})

/** Standard-Vault, wenn `OP_VAULT` weder in `.env` noch als ENV gesetzt ist. */
const DEFAULT_OP_VAULT = "VAULT"

/**
 * Ersetzt `${OP_VAULT}`-Platzhalter in einer 1Password-Referenz.
 *
 * @param reference - 1Password-Referenz im Format `op://${OP_VAULT}/item/field`.
 * @returns Aufgeloeste Referenz.
 */
function resolveVaultPlaceholder(reference) {
  const vault = process.env.OP_VAULT?.trim() || DEFAULT_OP_VAULT
  return reference.replace(/\$\{OP_VAULT\}/g, vault)
}

const combinedSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SPACETIMEDB_URI: z.string().min(1),
  NEXT_PUBLIC_SPACETIMEDB_DATABASE: z.string().min(1),
  NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER: z.literal("spacetime"),
  SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
})

const LOCAL_DEV_DEFAULTS = {
  NEXT_PUBLIC_AUTH_BYPASS: "true",
  NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER: "spacetime",
}

const PRESERVED_VAR_PREFIXES = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_TENANT_SLUG",
  "NEXT_PUBLIC_DEV_SUPABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SPACETIMEDB_URI",
  "NEXT_PUBLIC_SPACETIMEDB_DATABASE",
  "NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER",
]

const log = console.log
const success = (message) => log(chalk.green.bold(message))
const fail = (message) => log(chalk.red.bold(message))

/**
 * Liest das 1Password-Manifest fuer `pull-env`.
 *
 * @returns Das validierte Manifest.
 */
function loadManifest() {
  const manifestPath = path.resolve(process.cwd(), "scripts", "pull-env.manifest.json")
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8")
  return manifestSchema.parse(JSON.parse(manifestRaw))
}

/**
 * Liest erhaltene Variablen aus einer bestehenden `.env.local`.
 *
 * @param envPath - Pfad zur bestehenden `.env.local`.
 * @returns Ein Objekt mit erhaltenen Variablen.
 */
function getPreservedVariables(envPath) {
  const preserved = {}

  if (!fs.existsSync(envPath)) {
    return preserved
  }

  try {
    const content = fs.readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) {
        continue
      }

      const [key, ...valueParts] = line.split("=")
      const trimmedKey = key.trim()
      if (!PRESERVED_VAR_PREFIXES.some((prefix) => trimmedKey.startsWith(prefix))) {
        continue
      }

      preserved[trimmedKey] = valueParts
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "")
    }
  } catch {
    return preserved
  }

  return preserved
}

/**
 * Spiegelt bekannte Bootstrap-Aliase vor der Manifest-Aufloesung.
 * Damit bleibt der Pull-Env-Flow robust, auch wenn aeltere Projekte nur
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` oder nur `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
 * gesetzt haben.
 *
 * @param preservedVars - Bereits vorhandene Werte aus `.env.local`.
 */
function applyBootstrapAliases(preservedVars) {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    preservedVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? preservedVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && anonKey) {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = anonKey
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && publishableKey) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = publishableKey
  }
}

/**
 * Prueft, ob die 1Password CLI verfuegbar ist.
 */
function ensureOnePasswordCli() {
  try {
    execFileSync("op", ["--version"], { stdio: "pipe" })
    execFileSync("op", ["account", "list", "--format", "json"], {
      stdio: "pipe",
      env: process.env,
    })
  } catch {
    throw new Error(
      "1Password CLI (`op`) ist nicht betriebsbereit. Bitte installiere sie, fuehre einen stabilen CLI-Login aus und pruefe `op vault list`."
    )
  }
}

/**
 * Liest ein Secret ueber `op read`.
 *
 * @param reference - Die 1Password-Referenz im Format `op://vault/item/field`.
 * @returns Der gelesene Secret-Wert.
 */
function readFromOnePassword(reference) {
  const value = execFileSync("op", ["read", reference], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  }).trim()

  return value
}

/**
 * Loest einen einzelnen Manifest-Eintrag auf.
 *
 * @param entry - Der aufzulösende Manifest-Eintrag.
 * @returns Ein `[key, value]` Paar oder `null`, wenn der Eintrag optional leer ist.
 */
function resolveManifestEntry(entry) {
  if (entry.source === "bootstrap") {
    const bootstrapKey = entry.bootstrapEnvName ?? entry.envName
    const value = process.env[bootstrapKey]
    if ((!value || value.trim().length === 0) && entry.required) {
      throw new Error(`Bootstrap-Variable fehlt: ${bootstrapKey}`)
    }
    return value ? [entry.envName, value.trim()] : null
  }

  ensureOnePasswordCli()
  const rawReference = process.env[entry.opReferenceEnvName ?? ""] ?? entry.opReference
  if (!rawReference && entry.required) {
    throw new Error(`1Password-Referenz fehlt fuer ${entry.envName}`)
  }
  if (!rawReference) {
    return null
  }

  const reference = resolveVaultPlaceholder(rawReference)

  let value
  try {
    value = readFromOnePassword(reference)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const isMissingOptionalField =
      message.includes("does not have a field") ||
      message.includes("isn't an item") ||
      message.includes("could not get item")

    if (!entry.required && isMissingOptionalField) {
      return null
    }

    throw error
  }

  if ((!value || value.length === 0) && entry.required) {
    throw new Error(`Secret konnte nicht gelesen werden: ${entry.envName}`)
  }

  return value ? [entry.envName, value] : null
}

/**
 * Formatiert ein Objekt als `.env`-Zeilen.
 *
 * @param values - Key/Value-Paare fuer die Ausgabe.
 * @returns Formatierte `.env`-Zeilen.
 */
function formatEnvLines(values) {
  return Object.entries(values).map(
    ([key, value]) => `${key}=${String(value).includes(" ") ? `"${value}"` : value}`
  )
}

async function run() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local")
    const manifest = loadManifest()
    const preservedVars = getPreservedVariables(envPath)
    applyBootstrapAliases(preservedVars)
    const resolvedEntries = {}

    for (const entry of manifest.entries) {
      const result = resolveManifestEntry(entry)
      if (!result) {
        continue
      }
      const [key, value] = result
      resolvedEntries[key] = value
    }

    const mergedValues = {
      ...resolvedEntries,
      ...preservedVars,
      ...LOCAL_DEV_DEFAULTS,
    }

    const sections = [
      "# ════════════════════════════════════════════════════════════════════",
      "# Bootstrap- und Projektvariablen",
      "# ════════════════════════════════════════════════════════════════════",
      ...formatEnvLines({
        ...Object.fromEntries(
          Object.entries(mergedValues).filter(([key]) => PRESERVED_VAR_PREFIXES.includes(key))
        ),
      }),
      "",
      "# ════════════════════════════════════════════════════════════════════",
      "# Runtime-Secrets aus 1Password (via pnpm pull-env)",
      "# ════════════════════════════════════════════════════════════════════",
      ...formatEnvLines(
        Object.fromEntries(
          Object.entries(mergedValues).filter(
            ([key]) =>
              !PRESERVED_VAR_PREFIXES.includes(key) &&
              !Object.prototype.hasOwnProperty.call(LOCAL_DEV_DEFAULTS, key)
          )
        )
      ),
      "",
      "# ════════════════════════════════════════════════════════════════════",
      "# Lokale Entwicklungsdefaults",
      "# ════════════════════════════════════════════════════════════════════",
      ...formatEnvLines(LOCAL_DEV_DEFAULTS),
      "",
    ]

    fs.writeFileSync(envPath, sections.join("\n"))
    const parsedEnv = config({ path: envPath, override: true }).parsed
    if (!parsedEnv) {
      throw new Error(".env.local konnte nach dem Schreiben nicht gelesen werden.")
    }

    combinedSchema.parse(parsedEnv)

    success("✅ .env.local erfolgreich aus 1Password und Bootstrap-Variablen erzeugt.\n")
    log(chalk.cyan("🚀 Dev-Setup bereit. Als Nächstes: `pnpm dev`.\n"))
  } catch (error) {
    fail("\n❌ pull-env fehlgeschlagen.\n")
    log(chalk.red(`${error instanceof Error ? error.message : String(error)}\n`))
    process.exit(1)
  }
}

run()
