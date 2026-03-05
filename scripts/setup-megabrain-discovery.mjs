#!/usr/bin/env node
/**
 * Script zum Einrichten der discover_tables RPC-Funktion in MegaBrain
 * und zum Synchronisieren der Tabellen mit ai_datasources in KESSEL
 */

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade .env.local
dotenv.config({ path: join(__dirname, "..", ".env.local") })

const MEGABRAIN_URL = process.env.MEGABRAIN_SUPABASE_URL
const MEGABRAIN_SERVICE_KEY = process.env.MEGABRAIN_SERVICE_ROLE_KEY
const KESSEL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KESSEL_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!MEGABRAIN_URL || !MEGABRAIN_SERVICE_KEY) {
  console.error("❌ MEGABRAIN_SUPABASE_URL und MEGABRAIN_SERVICE_ROLE_KEY müssen gesetzt sein")
  process.exit(1)
}

if (!KESSEL_URL || !KESSEL_SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein")
  process.exit(1)
}

const megabrain = createClient(MEGABRAIN_URL, MEGABRAIN_SERVICE_KEY, {
  db: { schema: "public" },
})

const kessel = createClient(KESSEL_URL, KESSEL_SERVICE_KEY, {
  db: { schema: "public" },
})

async function main() {
  console.log("🔍 Verbinde zu MegaBrain...")

  // 1. Erstelle discover_tables Funktion in MegaBrain (falls nicht vorhanden)
  console.log("\n📦 Erstelle discover_tables RPC-Funktion in MegaBrain...")

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION discover_tables()
    RETURNS TABLE (table_schema TEXT, table_name TEXT) AS $$
    BEGIN
      RETURN QUERY
      SELECT t.table_schema::TEXT, t.table_name::TEXT
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
        AND t.table_name NOT LIKE '_prisma_%'
      ORDER BY t.table_name;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const { error: createError } = await megabrain.rpc("exec_sql", { sql: createFunctionSQL })

  if (createError) {
    // Versuche es direkt über die Tabellen zu lesen
    console.log("⚠️  Konnte discover_tables nicht erstellen (exec_sql nicht verfügbar)")
    console.log("    Versuche alternative Methode...")
  } else {
    console.log("✅ discover_tables Funktion erstellt/aktualisiert")
  }

  // 2. Lade Tabellen aus MegaBrain
  console.log("\n🔍 Lade Tabellen aus MegaBrain...")

  let tables = []

  // Versuche RPC
  const { data: rpcData, error: rpcError } = await megabrain.rpc("discover_tables")

  if (!rpcError && rpcData) {
    tables = rpcData
    console.log(`✅ ${tables.length} Tabellen über RPC gefunden`)
  } else {
    // Alternative: Lade bekannte Tabellen manuell
    console.log("⚠️  RPC nicht verfügbar, lade bekannte MegaBrain-Tabellen...")

    // Bekannte MegaBrain-Tabellen (Galaxy-System + PDF-Processing + weitere)
    const knownTables = [
      // Galaxy Core
      "galaxies",
      "galaxy_modules",
      "projects",
      "project_modules",
      "project_settings",
      "project_templates",
      // Dokumente & Ordner
      "folders",
      "documents",
      "document_types",
      "document_versions",
      "document_metadata",
      // Volumes & Storage
      "volumes",
      "volume_mappings",
      // Naming & Standards
      "naming_conventions",
      "naming_rules",
      "drawing_standards",
      "company_standards",
      // User & Teams
      "users",
      "user_settings",
      "user_preferences",
      "teams",
      "team_members",
      "permissions",
      "roles",
      // System
      "audit_log",
      "settings",
      "configurations",
      "app_settings",
      // PDF-Processing
      "pdf_pages",
      "pdf_processing_jobs",
      "pdf_documents",
      "pdf_extractions",
      // Weitere mögliche Tabellen
      "tags",
      "categories",
      "comments",
      "notifications",
      "activities",
      "files",
      "attachments",
      "links",
      "references",
      "templates",
      "workflows",
      "tasks",
      "milestones",
      "phases",
      "revisions",
      "approvals",
      "reviews",
      "checklists",
      "forms",
      "fields",
    ]

    // Prüfe welche existieren
    for (const tableName of knownTables) {
      const { error } = await megabrain.from(tableName).select("*").limit(0)
      if (!error) {
        tables.push({ table_schema: "public", table_name: tableName })
        console.log(`  ✓ ${tableName}`)
      }
    }

    if (tables.length === 0) {
      // Versuche alle Tabellen zu entdecken durch Abfragen
      console.log("\n🔍 Scanne bekannte Tabellennamen...")

      const potentialTables = [
        // Standard-Tabellen
        "galaxies",
        "galaxy_modules",
        "projects",
        "project_modules",
        "folders",
        "documents",
        "document_types",
        "volumes",
        "naming_conventions",
        "drawing_standards",
        "company_standards",
        "users",
        "user_settings",
        "teams",
        "team_members",
        "permissions",
        "audit_log",
        "settings",
        "configurations",
        // PDF-Processing (bereits bekannt)
        "pdf_pages",
        "pdf_processing_jobs",
      ]

      for (const tableName of potentialTables) {
        try {
          const { error } = await megabrain.from(tableName).select("*").limit(0)
          if (!error) {
            tables.push({ table_schema: "public", table_name: tableName })
          }
        } catch (e) {
          // Tabelle existiert nicht
        }
      }
    }
  }

  if (tables.length === 0) {
    console.log("❌ Keine Tabellen in MegaBrain gefunden")
    process.exit(1)
  }

  console.log(`\n📊 ${tables.length} Tabellen gefunden:`)
  tables.forEach((t) => console.log(`   - ${t.table_name}`))

  // 3. Synchronisiere mit ai_datasources in KESSEL
  console.log("\n📤 Synchronisiere mit KESSEL ai_datasources...")

  // Prüfe existierende Einträge
  const { data: existing } = await kessel
    .from("ai_datasources")
    .select("table_name")
    .eq("database_id", "megabrain")

  const existingNames = new Set(existing?.map((e) => e.table_name) ?? [])

  const newTables = tables.filter((t) => !existingNames.has(t.table_name))

  if (newTables.length === 0) {
    console.log("✅ Alle Tabellen sind bereits synchronisiert")
    return
  }

  // Füge neue Tabellen hinzu
  const inserts = newTables.map((table) => ({
    database_id: "megabrain",
    table_schema: table.table_schema,
    table_name: table.table_name,
    display_name: table.table_name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    access_level: "none", // Sicher: Standard ist kein Zugriff
    is_enabled: false, // Standard: Deaktiviert
  }))

  const { error: insertError } = await kessel.from("ai_datasources").insert(inserts)

  if (insertError) {
    console.error("❌ Fehler beim Einfügen:", insertError)
    process.exit(1)
  }

  console.log(`✅ ${newTables.length} neue Tabellen zu ai_datasources hinzugefügt:`)
  newTables.forEach((t) => console.log(`   + ${t.table_name}`))

  console.log("\n🎉 Fertig! Die MegaBrain-Tabellen sind jetzt in KESSEL registriert.")
  console.log("   Aktiviere sie über 'Datenbanken verwalten' → 'Tabellen verwalten'")
}

main().catch(console.error)
