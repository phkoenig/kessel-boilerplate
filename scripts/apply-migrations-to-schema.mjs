#!/usr/bin/env node

/**
 * Apply Migrations to Schema
 * ===========================
 *
 * Wendet alle Migrationen in einem bestimmten Schema an.
 * Verwendet direkte PostgreSQL-Verbindung über pg Library.
 *
 * Usage: node scripts/apply-migrations-to-schema.mjs <schema-name>
 *
 * Environment Variables:
 * - SUPABASE_DB_URL: PostgreSQL Connection String (postgresql://postgres:<password>@db.<project_ref>.supabase.co:5432/postgres?sslmode=require)
 *   ODER:
 * - SUPABASE_PROJECT_REF: Project Reference (z.B. ufqlocxqizmiaozkashi)
 * - SUPABASE_DB_PASSWORD: Database Password
 */

import { readFileSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import * as dotenv from "dotenv"
import pg from "pg"

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade .env.local und .env
dotenv.config({ path: join(__dirname, "..", ".env.local") })
dotenv.config({ path: join(__dirname, "..", ".env") })

const SCHEMA_NAME = process.argv[2] || process.env.NEXT_PUBLIC_PROJECT_SCHEMA || "public"

if (!SCHEMA_NAME || SCHEMA_NAME === "public") {
  console.error("❌ Fehler: Schema-Name muss angegeben werden (nicht 'public')")
  process.exit(1)
}

// Connection String bauen
let connectionString = process.env.SUPABASE_DB_URL

if (!connectionString) {
  // Versuche aus project_ref und password zu bauen
  const projectRef =
    process.env.SUPABASE_PROJECT_REF ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
  const dbPassword = process.env.SUPABASE_DB_PASSWORD

  if (!projectRef || !dbPassword) {
    console.error(
      "❌ Fehler: SUPABASE_DB_URL oder (SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD) müssen gesetzt sein"
    )
    console.error(
      "   SUPABASE_DB_URL Format: postgresql://postgres:<password>@db.<project_ref>.supabase.co:5432/postgres?sslmode=require"
    )
    process.exit(1)
  }

  connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`
}

async function applyMigration(migrationSQL, schemaName) {
  // Ersetze {{SCHEMA_NAME}} Platzhalter
  let sql = migrationSQL.replace(/\{\{SCHEMA_NAME\}\}/g, schemaName)

  // Ersetze alle "public." Referenzen mit Schema-Namen (außer auth.users, storage.*)
  sql = sql.replace(
    /CREATE TABLE IF NOT EXISTS public\./g,
    `CREATE TABLE IF NOT EXISTS ${schemaName}.`
  )
  sql = sql.replace(/CREATE TABLE public\./g, `CREATE TABLE ${schemaName}.`)
  sql = sql.replace(/ALTER TABLE public\./g, `ALTER TABLE ${schemaName}.`)
  sql = sql.replace(/CREATE INDEX.*ON public\./g, (match) =>
    match.replace("ON public.", `ON ${schemaName}.`)
  )
  sql = sql.replace(/CREATE POLICY.*ON public\./g, (match) =>
    match.replace("ON public.", `ON ${schemaName}.`)
  )
  sql = sql.replace(/FROM public\./g, (match) => {
    if (match.includes("auth.users") || match.includes("storage.")) {
      return match
    }
    return match.replace("FROM public.", `FROM ${schemaName}.`)
  })
  sql = sql.replace(/JOIN public\./g, (match) => {
    if (match.includes("auth.users") || match.includes("storage.")) {
      return match
    }
    return match.replace("JOIN public.", `JOIN ${schemaName}.`)
  })

  return sql
}

async function main() {
  console.log(`🚀 Wende Migrationen im Schema "${SCHEMA_NAME}" an...\n`)

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Supabase verwendet selbst-signierte Zertifikate
    },
  })

  try {
    await client.connect()
    console.log(`✓ Verbindung zur Datenbank hergestellt\n`)

    // 1. Erstelle Schema falls nicht vorhanden
    console.log(`📊 Erstelle Schema "${SCHEMA_NAME}"...`)
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA_NAME}";`)
    console.log(`✓ Schema "${SCHEMA_NAME}" erstellt/verfügbar\n`)

    // 2. Setze search_path für alle folgenden Queries
    await client.query(`SET search_path TO "${SCHEMA_NAME}", public;`)

    // 3. Lade alle Migrationen
    const migrationsDir = join(__dirname, "..", "supabase", "migrations")
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()

    console.log(`📦 Gefunden: ${migrationFiles.length} Migrationen\n`)

    // 4. Führe jede Migration aus
    for (const migrationFile of migrationFiles) {
      console.log(`   📄 Verarbeite: ${migrationFile}...`)
      const migrationPath = join(migrationsDir, migrationFile)
      const migrationSQL = readFileSync(migrationPath, "utf-8")

      try {
        const processedSQL = await applyMigration(migrationSQL, SCHEMA_NAME)

        // Führe SQL aus
        await client.query(processedSQL)
        console.log(`   ✓ ${migrationFile}`)
      } catch (error) {
        console.error(`   ❌ ${migrationFile} fehlgeschlagen: ${error.message}`)
        throw error
      }
    }

    console.log(`\n✅ Alle Migrationen erfolgreich im Schema "${SCHEMA_NAME}" angewendet!`)
  } catch (error) {
    console.error(`\n❌ Fehler beim Ausführen der Migration: ${error.message}`)
    if (error.stack) {
      console.error(`\nStack Trace:\n${error.stack}`)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error("Fataler Fehler:", error)
  process.exit(1)
})
