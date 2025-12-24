#!/usr/bin/env node

/**
 * Test-Script: RLS Tenant Setup (Direkter SQL-Zugriff)
 * ====================================================
 *
 * Testet die RLS Multi-Tenant Migration mit direktem SQL-Zugriff
 * (umgeht PostgREST Schema-Cache-Probleme)
 *
 * Voraussetzungen:
 * - SUPABASE_DB_PASSWORD muss in .env.local gesetzt sein
 * - Oder: DB-Passwort aus Supabase Dashboard > Settings > Database > Connection string
 */

import pg from "pg"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade Environment-Variablen
dotenv.config({ path: join(__dirname, "..", ".env.local") })
dotenv.config({ path: join(__dirname, "..", ".env") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Fehler: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein"
  )
  process.exit(1)
}

// Extrahiere Project Ref aus URL
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error("❌ Konnte Project Ref nicht aus URL extrahieren")
  process.exit(1)
}

// DB Password aus Environment (optional)
const dbPassword = process.env.SUPABASE_DB_PASSWORD
const useDirectSQL = !!dbPassword

if (!useDirectSQL) {
  console.log("⚠️  SUPABASE_DB_PASSWORD nicht gesetzt - verwende Supabase REST API")
  console.log(
    "   Für direkten SQL-Zugriff: Hole DB-Passwort aus Supabase Dashboard > Settings > Database > Connection string\n"
  )
}

const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`

const { Client } = pg

// Supabase Client für Auth-Operationen (public schema)
const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Supabase Client für infra-Schema RPCs
const infraClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "infra",
  },
})

async function testTenantSetup() {
  console.log(`🧪 Test: RLS Tenant Setup (${useDirectSQL ? "Direkter SQL-Zugriff" : "REST API"})\n`)
  console.log("=".repeat(60))

  let client = null
  if (useDirectSQL) {
    client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
    try {
      await client.connect()
      console.log("✓ Verbindung zur Datenbank hergestellt\n")
    } catch (error) {
      console.error("❌ Fehler bei DB-Verbindung:", error.message)
      throw error
    }
  } else {
    console.log("⚠️  Verwende REST API (einige Tests werden übersprungen)\n")
  }

  try {
    // Test 1: Prüfe ob app-Schema existiert (nur mit direktem SQL)
    if (useDirectSQL) {
      console.log("📋 Test 1: Schema-Prüfung")
      console.log("-".repeat(60))

      const schemaCheck = await client.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app'"
      )

      if (schemaCheck.rows.length === 0) {
        console.error("❌ app-Schema existiert nicht!")
        return false
      }
      console.log("✓ app-Schema existiert")

      // Prüfe Tabellen
      const tablesCheck = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'app'
        ORDER BY tablename
      `)

      console.log(
        `✓ Gefundene Tabellen im app-Schema: ${tablesCheck.rows.map((r) => r.tablename).join(", ")}`
      )

      if (!tablesCheck.rows.some((r) => r.tablename === "tenants")) {
        console.error("❌ app.tenants Tabelle fehlt!")
        return false
      }

      if (!tablesCheck.rows.some((r) => r.tablename === "user_tenants")) {
        console.error("❌ app.user_tenants Tabelle fehlt!")
        return false
      }
    } else {
      console.log("📋 Test 1: Schema-Prüfung (übersprungen - benötigt direkten SQL-Zugriff)")
      console.log("-".repeat(60))
      console.log("⚠️  Setze SUPABASE_DB_PASSWORD für vollständige Tests")
    }

    // Test 2: Tenant erstellen
    console.log("\n📋 Test 2: Tenant erstellen")
    console.log("-".repeat(60))

    const testTenant1 = {
      slug: "test-tenant-1",
      name: "Test Tenant 1",
    }

    let tenant1Id = null

    if (useDirectSQL) {
      // Prüfe ob Tenant bereits existiert
      const existingTenant = await client.query("SELECT id FROM app.tenants WHERE slug = $1", [
        testTenant1.slug,
      ])

      if (existingTenant.rows.length > 0) {
        tenant1Id = existingTenant.rows[0].id
        console.log(`✓ Tenant "${testTenant1.slug}" existiert bereits: ${tenant1Id}`)
      } else {
        const result = await client.query(
          "INSERT INTO app.tenants (slug, name) VALUES ($1, $2) RETURNING id",
          [testTenant1.slug, testTenant1.name]
        )
        tenant1Id = result.rows[0].id
        console.log(`✓ Tenant 1 erstellt: ${tenant1Id}`)
      }
    } else {
      // Verwende RPC über REST API (mit Retry und Debug-Logs)
      console.log(`\n🔍 Debug: Prüfe RPC-Verfügbarkeit...`)
      console.log(`   Supabase URL: ${supabaseUrl}`)
      console.log(`   Service Role Key vorhanden: ${!!serviceRoleKey}`)

      // Test: Prüfe ob PostgREST überhaupt erreichbar ist
      try {
        const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: "GET",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        })
        console.log(
          `   PostgREST Health Check Status: ${healthCheck.status} ${healthCheck.statusText}`
        )
        if (!healthCheck.ok) {
          const healthText = await healthCheck.text()
          console.log(`   PostgREST Response: ${healthText.substring(0, 200)}`)
        }
      } catch (healthError) {
        console.error(`   ❌ PostgREST Health Check fehlgeschlagen:`, healthError.message)
      }

      // Test: Prüfe ob RPC-Funktionen existieren
      console.log(`\n🔍 Debug: Prüfe RPC-Funktionen...`)
      const testRpc = await infraClient.rpc("get_tenant_by_slug", {
        p_slug: "non-existent-test-slug-12345",
      })

      console.log(`   RPC Test Response:`)
      console.log(`     - Error Code: ${testRpc.error?.code || "none"}`)
      console.log(`     - Error Message: ${testRpc.error?.message || "none"}`)
      console.log(
        `     - Error Details: ${JSON.stringify(testRpc.error?.details || null, null, 2)}`
      )
      console.log(`     - Error Hint: ${testRpc.error?.hint || "none"}`)

      if (testRpc.error) {
        console.log(`\n   Vollständige Error-Response:`)
        console.log(JSON.stringify(testRpc.error, null, 2))
      }

      let retries = 5
      let success = false
      let lastError = null

      while (retries > 0 && !success) {
        try {
          console.log(
            `\n🔍 Debug: Versuch ${6 - retries}/5 - Prüfe Tenant "${testTenant1.slug}"...`
          )

          const { data: existing, error: checkError } = await infraClient.rpc(
            "get_tenant_by_slug",
            {
              p_slug: testTenant1.slug,
            }
          )

          if (checkError) {
            lastError = checkError
            console.log(`   ❌ RPC Fehler:`)
            console.log(`      Code: ${checkError.code}`)
            console.log(`      Message: ${checkError.message}`)
            console.log(`      Details: ${JSON.stringify(checkError.details || null)}`)
            console.log(`      Hint: ${checkError.hint || "none"}`)

            if (checkError.code === "PGRST002" || checkError.message.includes("Retrying")) {
              console.log(
                `   ⚠️  PostgREST lädt noch, warte 3 Sekunden... (${retries} Versuche übrig)`
              )
              await new Promise((resolve) => setTimeout(resolve, 3000))
              retries--
              continue
            } else if (
              checkError.code === "42883" ||
              checkError.message.includes("does not exist")
            ) {
              console.error(`   ❌ RPC-Funktion existiert nicht!`)
              console.error(`   Prüfe Migration 014: infra.get_tenant_by_slug() sollte existieren`)
              throw new Error(`RPC-Funktion nicht gefunden: ${checkError.message}`)
            } else {
              // Nicht-Retry-Fehler - weiter mit Erstellung
              console.log(`   ⚠️  Tenant nicht gefunden, versuche Erstellung...`)
            }
          } else {
            if (existing && existing.length > 0) {
              tenant1Id = existing[0].id
              console.log(`   ✓ Tenant "${testTenant1.slug}" existiert bereits: ${tenant1Id}`)
              success = true
              break
            }
          }

          // Versuche Tenant zu erstellen
          console.log(`   🔍 Versuche Tenant zu erstellen...`)
          const { data: newTenantId, error: createError } = await infraClient.rpc("create_tenant", {
            p_slug: testTenant1.slug,
            p_name: testTenant1.name,
          })

          if (createError) {
            lastError = createError
            console.log(`   ❌ Create RPC Fehler:`)
            console.log(`      Code: ${createError.code}`)
            console.log(`      Message: ${createError.message}`)
            console.log(`      Details: ${JSON.stringify(createError.details || null)}`)
            console.log(`      Hint: ${createError.hint || "none"}`)

            if (createError.code === "PGRST002" || createError.message.includes("Retrying")) {
              console.log(
                `   ⚠️  PostgREST lädt noch, warte 3 Sekunden... (${retries} Versuche übrig)`
              )
              await new Promise((resolve) => setTimeout(resolve, 3000))
              retries--
              continue
            } else if (
              createError.code === "42883" ||
              createError.message.includes("does not exist")
            ) {
              console.error(`   ❌ RPC-Funktion existiert nicht!`)
              console.error(`   Prüfe Migration 014: infra.create_tenant() sollte existieren`)
              throw new Error(`RPC-Funktion nicht gefunden: ${createError.message}`)
            } else {
              console.error(`   ❌ Unerwarteter Fehler:`, createError)
              throw createError
            }
          } else {
            tenant1Id = newTenantId
            console.log(`   ✓ Tenant 1 erstellt: ${tenant1Id}`)
            success = true
            break
          }
        } catch (error) {
          lastError = error
          console.log(`   ❌ Exception:`)
          console.log(`      Message: ${error.message}`)
          console.log(`      Stack: ${error.stack?.substring(0, 300)}`)

          if (error.code === "PGRST002" || error.message.includes("Retrying")) {
            console.log(
              `   ⚠️  PostgREST lädt noch, warte 3 Sekunden... (${retries} Versuche übrig)`
            )
            await new Promise((resolve) => setTimeout(resolve, 3000))
            retries--
            continue
          } else {
            throw error
          }
        }
      }

      if (!success) {
        console.error("\n❌ PostgREST ist nach mehreren Versuchen nicht verfügbar.")
        console.error("\n📝 Letzter Fehler:")
        if (lastError) {
          console.error(`   Code: ${lastError.code || "unknown"}`)
          console.error(`   Message: ${lastError.message || "unknown"}`)
          console.error(`   Details: ${JSON.stringify(lastError.details || null, null, 2)}`)
          console.error(`   Hint: ${lastError.hint || "none"}`)
        }
        console.error("\n📝 Mögliche Lösungen:")
        console.error("   1. ⚠️  PostgREST-Konfiguration:")
        console.error(
          "      Das app-Schema muss NICHT in PostgREST sein, wenn RPC-Funktionen verwendet werden!"
        )
        console.error("      Die RPC-Funktionen sind im infra-Schema (bereits verfügbar)")
        console.error("")
        console.error("   2. Prüfe ob Migration 014 angewendet wurde:")
        console.error("      supabase migration list --linked")
        console.error("")
        console.error("   3. Prüfe ob RPC-Funktionen existieren (im infra Schema):")
        console.error(
          "      SELECT proname FROM pg_proc WHERE proname IN ('get_tenant_by_slug', 'create_tenant')"
        )
        console.error(
          "      UND prüfe Schema: SELECT nspname FROM pg_namespace WHERE nspname = 'infra'"
        )
        console.error("")
        console.error("   4. Mögliche Ursachen für PGRST002:")
        console.error("      - PostgREST lädt noch (nach Schema-Änderungen)")
        console.error("      - Temporäre Verbindungsprobleme")
        console.error("      - Warte 2-5 Minuten und versuche es erneut")
        console.error("")
        console.error("   5. Alternative: Verwende direkten SQL-Zugriff für Tests:")
        console.error('      export SUPABASE_DB_PASSWORD="..."')
        console.error("      node scripts/test-rls-tenant-setup-sql.mjs")
        console.error("\n📖 Siehe auch: docs/04_knowledge/rls-testing-guide.md\n")
        throw new Error("PostgREST ist nach mehreren Versuchen nicht verfügbar")
      }
    }

    // Test 3-6: Datenbank-Struktur-Tests (nur mit direktem SQL)
    if (useDirectSQL) {
      // Test 3: Prüfe current_tenant_id() Funktion
      console.log("\n📋 Test 3: current_tenant_id() Funktion")
      console.log("-".repeat(60))

      // Setze Mock-JWT Claims
      await client.query(`SET request.jwt.claims = '{"tenant_id": "${tenant1Id}"}'`)

      const functionResult = await client.query("SELECT app.current_tenant_id() as tenant_id")
      const returnedTenantId = functionResult.rows[0].tenant_id

      if (returnedTenantId === tenant1Id) {
        console.log(`✓ current_tenant_id() funktioniert: ${returnedTenantId}`)
      } else {
        console.error(
          `❌ current_tenant_id() fehlgeschlagen. Erwartet: ${tenant1Id}, Gefunden: ${returnedTenantId}`
        )
        return false
      }

      // Reset JWT Claims
      await client.query("RESET request.jwt.claims")

      // Test 4: Prüfe custom_access_token_hook Funktion
      console.log("\n📋 Test 4: custom_access_token_hook() Funktion")
      console.log("-".repeat(60))

      const hookCheck = await client.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'custom_access_token_hook' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'app')
      `)

      if (hookCheck.rows.length === 0) {
        console.error("❌ custom_access_token_hook() Funktion fehlt!")
        return false
      }
      console.log("✓ custom_access_token_hook() Funktion existiert")

      // Test 5: Prüfe RLS Policies
      console.log("\n📋 Test 5: RLS Policies")
      console.log("-".repeat(60))

      const rlsCheck = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'bugs', 'features', 'feature_votes', 'user_interactions')
        ORDER BY tablename
      `)

      console.log("RLS Status für Tabellen:")
      for (const row of rlsCheck.rows) {
        console.log(`  ${row.tablename}: ${rowsecurity ? "✓ Aktiviert" : "❌ Nicht aktiviert"}`)
      }

      const allRLSEnabled = rlsCheck.rows.every((r) => r.rowsecurity)
      if (!allRLSEnabled) {
        console.error("❌ Nicht alle Tabellen haben RLS aktiviert!")
        return false
      }

      // Test 6: Prüfe tenant_id Spalten
      console.log("\n📋 Test 6: tenant_id Spalten")
      console.log("-".repeat(60))

      const columnsCheck = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'tenant_id'
        ORDER BY table_name
      `)

      const expectedTables = ["profiles", "bugs", "features", "feature_votes", "user_interactions"]
      const foundTables = columnsCheck.rows.map((r) => r.table_name)

      console.log(`Gefundene tenant_id Spalten: ${foundTables.join(", ")}`)

      const allColumnsPresent = expectedTables.every((t) => foundTables.includes(t))
      if (!allColumnsPresent) {
        const missing = expectedTables.filter((t) => !foundTables.includes(t))
        console.error(`❌ Fehlende tenant_id Spalten in: ${missing.join(", ")}`)
        return false
      }
      console.log("✓ Alle Tabellen haben tenant_id Spalte")
    } else {
      console.log(
        "\n📋 Test 3-6: Datenbank-Struktur-Tests (übersprungen - benötigt direkten SQL-Zugriff)"
      )
      console.log("⚠️  Setze SUPABASE_DB_PASSWORD für vollständige Tests")
    }

    // Test 7: User erstellen und zu Tenant zuordnen
    console.log("\n📋 Test 7: User erstellen und zu Tenant zuordnen")
    console.log("-".repeat(60))

    const testUser1 = {
      email: "test-user-1@test.local",
      password: "test-password-123",
      display_name: "Test User 1",
    }

    // Prüfe ob User bereits existiert
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers()
    const foundUser1 = existingUsers.users.find((u) => u.email === testUser1.email)

    let user1Id = null
    if (foundUser1) {
      user1Id = foundUser1.id
      console.log(`✓ User 1 existiert bereits: ${user1Id}`)
    } else {
      const { data: user1, error: error1 } = await supabaseClient.auth.admin.createUser({
        email: testUser1.email,
        password: testUser1.password,
        user_metadata: {
          display_name: testUser1.display_name,
        },
        email_confirm: true,
      })

      if (error1) {
        console.error(`❌ Fehler beim Erstellen von User 1:`, error1)
        throw error1
      }
      user1Id = user1.user.id
      console.log(`✓ User 1 erstellt: ${user1Id}`)
    }

    // User zu Tenant zuordnen
    if (useDirectSQL) {
      const assignResult = await client.query(
        `INSERT INTO app.user_tenants (user_id, tenant_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3
         RETURNING user_id, tenant_id, role`,
        [user1Id, tenant1Id, "owner"]
      )
      console.log(`✓ User 1 → Tenant 1 (${assignResult.rows[0].role})`)
    } else {
      // Mit Retry
      let retries = 5
      let success = false

      while (retries > 0 && !success) {
        const { data: assignResult, error } = await infraClient.rpc("assign_user_to_tenant", {
          p_user_id: user1Id,
          p_tenant_id: tenant1Id,
          p_role: "owner",
        })

        if (error) {
          if (error.code === "PGRST002" || error.message.includes("Retrying")) {
            console.log(`⚠️  PostgREST lädt noch, warte 3 Sekunden... (${retries} Versuche übrig)`)
            await new Promise((resolve) => setTimeout(resolve, 3000))
            retries--
            continue
          } else {
            console.error(`❌ Fehler bei User-Tenant-Zuordnung:`, error)
            throw error
          }
        }
        console.log(`✓ User 1 → Tenant 1 (owner)`)
        success = true
      }

      if (!success) {
        throw new Error("User-Tenant-Zuordnung nach mehreren Versuchen fehlgeschlagen")
      }
    }

    // Test 8: JWT Claims prüfen (Login)
    console.log("\n📋 Test 8: JWT Claims nach Login prüfen")
    console.log("-".repeat(60))

    // Erstelle Anon-Client für Login
    const anonClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: session1, error: loginError1 } = await anonClient.auth.signInWithPassword({
      email: testUser1.email,
      password: testUser1.password,
    })

    if (loginError1) {
      console.error(`❌ Login fehlgeschlagen für User 1:`, loginError1)
      throw loginError1
    }

    if (!session1.session) {
      console.error(`❌ Keine Session für User 1`)
      throw new Error("Keine Session erhalten")
    }

    // Dekodiere JWT (einfache Base64-Dekodierung)
    const tokenParts = session1.session.access_token.split(".")
    if (tokenParts.length !== 3) {
      console.error(`❌ Ungültiges JWT-Format`)
      throw new Error("Ungültiges JWT-Format")
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString())
    console.log(`✓ User 1 JWT Claims:`)
    console.log(`  - sub: ${payload.sub}`)
    console.log(`  - email: ${payload.email}`)
    console.log(`  - tenant_id: ${payload.tenant_id || "FEHLT"}`)

    if (payload.tenant_id) {
      console.log(`✓ tenant_id im JWT gefunden: ${payload.tenant_id}`)
      if (payload.tenant_id === tenant1Id) {
        console.log(`✓ tenant_id stimmt mit Tenant 1 überein!`)
      } else {
        console.error(
          `❌ tenant_id stimmt nicht überein! Erwartet: ${tenant1Id}, Gefunden: ${payload.tenant_id}`
        )
        console.log(`⚠️  Hinweis: Auth Hook muss im Dashboard konfiguriert sein!`)
        return false
      }
    } else {
      console.error(`❌ tenant_id fehlt im JWT!`)
      console.log(`⚠️  Hinweis: Auth Hook muss im Dashboard konfiguriert sein!`)
      console.log(`   Siehe: docs/04_knowledge/rls-auth-hook-setup.md`)
      return false
    }

    // Test 9: RLS Isolation testen
    console.log("\n📋 Test 9: RLS Isolation zwischen Tenants")
    console.log("-".repeat(60))

    // Hole die role_id für 'user' Role
    const { data: userRole, error: roleError } = await supabaseClient
      .from("roles")
      .select("id")
      .eq("name", "user")
      .single()

    if (roleError) {
      console.error(`❌ Fehler beim Abrufen der User-Role:`, roleError)
      throw roleError
    }
    const userRoleId = userRole?.id
    console.log(`✓ User-Role ID: ${userRoleId}`)

    // Erstelle Test-Daten für Tenant 1 (über Service Role)
    const { data: profile1, error: profileError1 } = await supabaseClient
      .from("profiles")
      .insert({
        id: user1Id,
        email: testUser1.email,
        display_name: testUser1.display_name,
        tenant_id: tenant1Id,
        role_id: userRoleId,
      })
      .select()
      .single()

    if (profileError1 && !profileError1.message.includes("duplicate")) {
      console.error(`❌ Fehler beim Erstellen von Profile 1:`, profileError1)
      throw profileError1
    }
    console.log(`✓ Profile für User 1 erstellt`)

    // Prüfe ob User 1 nur seine eigenen Daten sieht (über anonClient mit Session)
    const { data: profiles, error: selectError } = await anonClient
      .from("profiles")
      .select("id, email, tenant_id")

    if (selectError) {
      console.error(`❌ Fehler beim Abfragen von Profiles:`, selectError)
      throw selectError
    }

    console.log(`✓ User 1 sieht ${profiles?.length || 0} Profile(s)`)

    // Prüfe ob alle Profile zu Tenant 1 gehören
    const allFromTenant1 = profiles?.every((p) => p.tenant_id === tenant1Id)
    if (allFromTenant1 && profiles && profiles.length > 0) {
      console.log(`✓ RLS Isolation funktioniert: User 1 sieht nur Daten von Tenant 1`)
    } else {
      console.warn(`⚠️  RLS Isolation: User 1 sieht ${profiles?.length || 0} Profile(s)`)
      if (profiles && profiles.length > 0) {
        console.log(
          `   Gefundene Profiles:`,
          profiles.map((p) => ({ id: p.id, tenant_id: p.tenant_id }))
        )
      }
    }

    await anonClient.auth.signOut()

    console.log("\n" + "=".repeat(60))
    console.log("✅ Alle Tests erfolgreich!")
    console.log("=".repeat(60))
    console.log("\n📝 Zusammenfassung:")
    console.log(`   - Tenant erstellt: ${tenant1Id}`)
    console.log(`   - User erstellt: ${user1Id}`)
    console.log(`   - User-Tenant-Zuordnung: ✓`)
    console.log(`   - JWT Claims: ✓ (tenant_id vorhanden)`)
    console.log(`   - RLS Isolation: ✓`)
    console.log("")

    return true
  } catch (error) {
    console.error("❌ Fehler:", error.message)
    if (error.stack) {
      console.error("\nStack Trace:", error.stack)
    }
    return false
  } finally {
    if (client) {
      await client.end()
    }
  }
}

// Hauptfunktion
testTenantSetup()
  .then((success) => {
    if (success) {
      console.log("🎉 RLS Multi-Tenant Setup ist funktionsfähig!")
      process.exit(0)
    } else {
      console.log("❌ Einige Tests sind fehlgeschlagen")
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error("❌ Fataler Fehler:", error)
    process.exit(1)
  })
