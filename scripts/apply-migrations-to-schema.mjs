#!/usr/bin/env node
/**
 * Apply Migrations to Schema (RLS-Tenant-basiert)
 * ================================================
 *
 * Dieses Script wird von der kessel-cli verwendet, um:
 * 1. Einen neuen Tenant zu erstellen (app.tenants)
 * 2. Standard-User dem Tenant zuzuordnen (app.user_tenants)
 *
 * WICHTIG: Seit v1.1.0 verwendet Kessel RLS-basierte Multi-Tenancy,
 * nicht mehr separate Schemas pro Projekt.
 *
 * Verwendung:
 *   node scripts/apply-migrations-to-schema.mjs <tenant-slug>
 *
 * Beispiel:
 *   node scripts/apply-migrations-to-schema.mjs galaxy
 *   node scripts/apply-migrations-to-schema.mjs meine-app
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import pg from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade Environment-Variablen
dotenv.config({ path: join(__dirname, "..", ".env.local") })
dotenv.config({ path: join(__dirname, "..", ".env") })

// Konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const dbPassword = process.env.SUPABASE_DB_PASSWORD

// Argument: Tenant-Slug
const tenantSlug = process.argv[2]

if (!tenantSlug) {
  console.error("❌ Fehler: Tenant-Slug erforderlich")
  console.error("")
  console.error("Verwendung:")
  console.error("  node scripts/apply-migrations-to-schema.mjs <tenant-slug>")
  console.error("")
  console.error("Beispiel:")
  console.error("  node scripts/apply-migrations-to-schema.mjs galaxy")
  process.exit(1)
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Fehler: NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY müssen gesetzt sein")
  process.exit(1)
}

// Tenant-Name aus Slug generieren (erster Buchstabe groß)
const tenantName = tenantSlug
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ")

console.log(`\n🔧 Kessel Multi-Tenant Setup`)
console.log(`=`.repeat(50))
console.log(`   Tenant-Slug: ${tenantSlug}`)
console.log(`   Tenant-Name: ${tenantName}`)
console.log(`   Supabase:    ${supabaseUrl}`)
console.log(`=`.repeat(50))

// Supabase Clients
const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client für infra-Schema (RPC-Funktionen)
const infraClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "infra",
  },
})

// Client für app-Schema (Tenant-Tabellen)
const appClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "app",
  },
})

/**
 * Erstellt Tenant via direkter PostgreSQL-Verbindung
 */
async function createTenantViaPg() {
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]

  if (!projectRef) {
    throw new Error("Konnte Project Ref nicht aus URL extrahieren")
  }

  if (!dbPassword) {
    console.log("\n⚠️  SUPABASE_DB_PASSWORD nicht gesetzt - versuche RPC-Fallback")
    return null
  }

  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`

  const client = new pg.Client({
    connectionString,
    ssl: true, // Supabase erfordert SSL, Zertifikat wird validiert
  })

  try {
    await client.connect()
    console.log("\n✅ PostgreSQL-Verbindung hergestellt")

    // Prüfe ob app.tenants existiert
    const schemaCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'app' 
        AND table_name = 'tenants'
      ) as exists
    `)

    if (!schemaCheck.rows[0].exists) {
      console.log("⚠️  app.tenants existiert nicht - Basis-Migrationen fehlen")
      console.log("   Führe erst die Basis-Migrationen im Supabase Dashboard aus:")
      console.log("   009_rls_tenant_setup.sql bis 014_tenant_rpc_functions.sql")
      await client.end()
      return null
    }

    // Tenant erstellen/aktualisieren
    const result = await client.query(
      `
      INSERT INTO app.tenants (slug, name)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE SET name = $2, updated_at = NOW()
      RETURNING id
    `,
      [tenantSlug, tenantName]
    )

    const tenantId = result.rows[0].id
    console.log(`✅ Tenant erstellt/aktualisiert: ${tenantId}`)

    await client.end()
    return tenantId
  } catch (error) {
    console.log(`⚠️  PostgreSQL-Verbindung fehlgeschlagen: ${error.message}`)
    try {
      await client.end()
    } catch {
      // Ignorieren
    }
    return null
  }
}

/**
 * Erstellt Tenant via RPC-Funktionen
 */
async function createTenantViaRpc() {
  try {
    // Prüfe ob Tenant bereits existiert
    const { data: existing, error: checkError } = await infraClient.rpc("get_tenant_by_slug", {
      p_slug: tenantSlug,
    })

    if (!checkError && existing && existing.length > 0) {
      console.log(`✅ Tenant "${tenantSlug}" existiert bereits: ${existing[0].id}`)
      return existing[0].id
    }

    // Tenant erstellen
    const { data: tenantId, error: createError } = await infraClient.rpc("create_tenant", {
      p_slug: tenantSlug,
      p_name: tenantName,
    })

    if (createError) {
      throw createError
    }

    console.log(`✅ Tenant erstellt: ${tenantId}`)
    return tenantId
  } catch (error) {
    console.log(`⚠️  RPC-Aufruf fehlgeschlagen: ${error.message}`)
    return null
  }
}

/**
 * Ordnet Standard-User dem Tenant zu
 */
async function assignStandardUsers(tenantId) {
  const standardUsers = [
    { email: "admin@local", role: "owner" },
    { email: "user@local", role: "member" },
  ]

  console.log("\n📋 Ordne Standard-User zu...")

  for (const { email, role } of standardUsers) {
    try {
      // Finde User
      const { data: users, error: listError } = await supabaseClient.auth.admin.listUsers()

      if (listError) {
        console.log(`   ⚠️  Konnte User nicht laden: ${listError.message}`)
        continue
      }

      const user = users?.users?.find((u) => u.email === email)

      if (!user) {
        console.log(`   ⚠️  User "${email}" nicht gefunden - überspringe`)
        continue
      }

      // Ordne zu Tenant zu via RPC
      try {
        const { error: assignError } = await infraClient.rpc("assign_user_to_tenant", {
          p_user_id: user.id,
          p_tenant_id: tenantId,
          p_role: role,
        })

        if (assignError) {
          // Fallback: Direkter Insert via app-Schema Client (falls RPC nicht verfügbar)
          const { error: insertError } = await appClient.from("user_tenants").upsert(
            {
              user_id: user.id,
              tenant_id: tenantId,
              role: role,
              is_active: true,
            },
            {
              onConflict: "user_id,tenant_id",
            }
          )

          if (insertError) {
            console.log(`   ⚠️  Fehler bei ${email}: ${insertError.message}`)
          } else {
            console.log(`   ✅ ${email} → Tenant (${role}) [via INSERT]`)
          }
        } else {
          console.log(`   ✅ ${email} → Tenant (${role})`)
        }
      } catch (rpcError) {
        console.log(`   ⚠️  RPC-Fehler bei ${email}: ${rpcError.message}`)
      }
    } catch (error) {
      console.log(`   ⚠️  Fehler bei ${email}: ${error.message}`)
    }
  }
}

/**
 * Kopiert Themes in Tenant-Ordner (falls Schema-basiert)
 */
async function setupThemes() {
  console.log("\n📋 Prüfe Theme-Setup...")

  try {
    // Liste alle Themes im Root
    const { data: rootThemes, error: listError } = await supabaseClient.storage
      .from("themes")
      .list("", { limit: 100 })

    if (listError) {
      console.log(`   ⚠️  Theme-Bucket nicht erreichbar: ${listError.message}`)
      return
    }

    const cssThemes = rootThemes?.filter((f) => f.name.endsWith(".css")) || []

    if (cssThemes.length === 0) {
      console.log("   ⚠️  Keine Themes im Root gefunden")
      return
    }

    console.log(`   📦 ${cssThemes.length} Themes im Root gefunden`)

    // Prüfe ob Themes im Tenant-Ordner existieren
    const { data: tenantThemes } = await supabaseClient.storage
      .from("themes")
      .list(tenantSlug, { limit: 100 })

    if (tenantThemes && tenantThemes.length > 0) {
      console.log(`   ✅ Tenant hat bereits ${tenantThemes.length} Themes`)
      return
    }

    // Kopiere default.css als Fallback
    let copied = 0
    for (const theme of cssThemes.slice(0, 3)) {
      // Max 3 Themes kopieren
      try {
        const { data: themeData } = await supabaseClient.storage.from("themes").download(theme.name)

        if (themeData) {
          const content = await themeData.text()
          await supabaseClient.storage
            .from("themes")
            .upload(`${tenantSlug}/${theme.name}`, content, {
              contentType: "text/css",
              upsert: true,
            })
          copied++
        }
      } catch {
        // Ignorieren
      }
    }

    if (copied > 0) {
      console.log(`   ✅ ${copied} Themes in Tenant-Ordner kopiert`)
    }
  } catch (error) {
    console.log(`   ⚠️  Theme-Setup übersprungen: ${error.message}`)
  }
}

/**
 * Aktualisiert App-Name in app_settings
 */
async function updateAppSettings() {
  console.log("\n📋 Aktualisiere App-Einstellungen...")

  try {
    const { error: updateError } = await supabaseClient
      .from("app_settings")
      .update({
        app_name: tenantName,
        app_description: `${tenantName} - Erstellt mit Kessel CLI`,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001")

    if (updateError) {
      console.log(`   ⚠️  App-Settings Update fehlgeschlagen: ${updateError.message}`)
      return
    }

    console.log(`   ✅ App-Name auf "${tenantName}" gesetzt`)
  } catch (error) {
    console.log(`   ⚠️  App-Settings übersprungen: ${error.message}`)
  }
}

/**
 * Hauptfunktion
 */
async function main() {
  let tenantId = null

  // Schritt 1: Tenant erstellen (zuerst via PG, dann RPC)
  console.log("\n📋 Schritt 1: Tenant erstellen")
  console.log("-".repeat(50))

  tenantId = await createTenantViaPg()

  if (!tenantId) {
    console.log("   Versuche RPC-Fallback...")
    tenantId = await createTenantViaRpc()
  }

  if (!tenantId) {
    console.log("\n⚠️  Tenant konnte nicht erstellt werden.")
    console.log("   Dies kann folgende Gründe haben:")
    console.log("   1. Die Basis-Migrationen (009-014) wurden noch nicht ausgeführt")
    console.log("   2. SUPABASE_DB_PASSWORD fehlt in .env")
    console.log("   3. Die RPC-Funktionen sind nicht verfügbar")
    console.log("")
    console.log("   Manuelle Alternative:")
    console.log("   1. Öffne Supabase SQL Editor")
    console.log(`   2. Führe aus: SELECT infra.create_tenant('${tenantSlug}', '${tenantName}');`)
    console.log("")
    console.log("   Das Projekt kann trotzdem gestartet werden.")
    console.log("   Der Tenant muss nur vor dem ersten Login erstellt werden.")
    return
  }

  // Schritt 2: Standard-User zuordnen
  console.log("\n📋 Schritt 2: Standard-User zuordnen")
  console.log("-".repeat(50))
  await assignStandardUsers(tenantId)

  // Schritt 3: Themes einrichten
  console.log("\n📋 Schritt 3: Themes einrichten")
  console.log("-".repeat(50))
  await setupThemes()

  // Schritt 4: App-Einstellungen aktualisieren
  console.log("\n📋 Schritt 4: App-Einstellungen aktualisieren")
  console.log("-".repeat(50))
  await updateAppSettings()

  // Zusammenfassung
  console.log("\n" + "=".repeat(50))
  console.log("✅ Multi-Tenant Setup abgeschlossen!")
  console.log("=".repeat(50))

  console.log(`
📝 Konfiguration für .env.local:

   NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
   NEXT_PUBLIC_TENANT_SLUG=${tenantSlug}

📝 Nächste Schritte:

   1. Auth Hook aktivieren (falls noch nicht):
      Dashboard → Authentication → Hooks → Custom Access Token
      Schema: app, Function: custom_access_token_hook

   2. Dev-Server starten:
      pnpm dev

   3. Einloggen mit:
      admin@local / admin123 (Admin)
      user@local / user123 (User)
`)

  console.log(`\n🎉 Tenant-ID: ${tenantId}\n`)
}

// Ausführen
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n❌ Fehler:`, error.message)
    process.exit(1)
  })
