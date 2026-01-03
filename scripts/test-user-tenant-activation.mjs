#!/usr/bin/env node

/**
 * Test-Script für User-Tenant Aktivierungs-Flag
 * ===============================================
 *
 * Testet die is_active Funktionalität:
 * 1. Erstellt Test-User und Test-Tenant
 * 2. Verknüpft User mit Tenant (is_active = true)
 * 3. Prüft Auth Hook: tenant_id sollte vorhanden sein
 * 4. Setzt is_active = false
 * 5. Prüft Auth Hook: tenant_id sollte NULL sein
 * 6. Reaktiviert User (is_active = true)
 * 7. Prüft Auth Hook: tenant_id sollte wieder vorhanden sein
 * 8. Testet Helper-Funktion app.is_user_active_in_tenant()
 * 9. Räumt auf
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Fehler: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein"
  )
  process.exit(1)
}

// Extrahiere Project Ref aus URL
const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error("❌ Konnte Project Ref nicht aus URL extrahieren")
  process.exit(1)
}

const useDirectSQL = !!DB_PASSWORD
if (!useDirectSQL) {
  console.error("❌ SUPABASE_DB_PASSWORD muss gesetzt sein für dieses Script")
  console.error(
    "   Hole DB-Passwort aus Supabase Dashboard > Settings > Database > Connection string"
  )
  process.exit(1)
}

const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`

const { Client } = pg
let pgClient = null

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test-Daten
const TEST_USER_EMAIL = `test-activation-${Date.now()}@test.local`
const TEST_USER_PASSWORD = "test123456"
const TEST_TENANT_SLUG = `test-activation-${Date.now()}`
const TEST_TENANT_NAME = "Test Activation Tenant"

let testUserId = null
let testTenantId = null

async function cleanup() {
  console.log("\n🧹 Aufräumen...")

  if (testUserId) {
    try {
      // Lösche User-Tenant-Zuordnung
      if (pgClient) {
        try {
          await pgClient.query("DELETE FROM app.user_tenants WHERE user_id = $1", [testUserId])
        } catch (error) {
          console.warn("⚠️  Fehler beim Löschen der User-Tenant-Zuordnung:", error.message)
        }
      }

      // Lösche User (via Admin API)
      const { error: userError } = await supabase.auth.admin.deleteUser(testUserId)
      if (userError) {
        console.warn("⚠️  Fehler beim Löschen des Test-Users:", userError.message)
      } else {
        console.log("✅ Test-User gelöscht")
      }
    } catch (error) {
      console.warn("⚠️  Fehler beim Aufräumen:", error.message)
    }
  }

  if (testTenantId && pgClient) {
    try {
      await pgClient.query("DELETE FROM app.tenants WHERE id = $1", [testTenantId])
      console.log("✅ Test-Tenant gelöscht")
    } catch (error) {
      console.warn("⚠️  Fehler beim Löschen des Tenants:", error.message)
    }
  }

  if (pgClient) {
    await pgClient.end()
  }
}

// Fehler-Handler
process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)
process.on("uncaughtException", async (error) => {
  console.error("\n❌ Unerwarteter Fehler:", error)
  await cleanup()
  process.exit(1)
})

async function main() {
  console.log("🧪 Test: User-Tenant Aktivierungs-Flag\n")

  // Verbinde mit PostgreSQL
  pgClient = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Supabase verwendet selbst-signierte Zertifikate
    },
  })
  try {
    await pgClient.connect()
  } catch (error) {
    console.error("❌ Fehler bei PostgreSQL-Verbindung:", error.message)
    console.error("   Stelle sicher, dass SUPABASE_DB_PASSWORD korrekt gesetzt ist")
    process.exit(1)
  }

  try {
    // ============================================
    // Schritt 1: Test-User erstellen
    // ============================================
    console.log("1️⃣  Erstelle Test-User...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    })

    if (authError) throw authError
    testUserId = authData.user.id
    console.log(`✅ Test-User erstellt: ${TEST_USER_EMAIL} (${testUserId})`)

    // ============================================
    // Schritt 2: Test-Tenant erstellen
    // ============================================
    console.log("\n2️⃣  Erstelle Test-Tenant...")
    const tenantResult = await pgClient.query(
      "INSERT INTO app.tenants (slug, name) VALUES ($1, $2) RETURNING id",
      [TEST_TENANT_SLUG, TEST_TENANT_NAME]
    )
    testTenantId = tenantResult.rows[0].id
    console.log(`✅ Test-Tenant erstellt: ${TEST_TENANT_NAME} (${testTenantId})`)

    // ============================================
    // Schritt 3: User-Tenant-Zuordnung (is_active = true)
    // ============================================
    console.log("\n3️⃣  Verknüpfe User mit Tenant (is_active = true)...")
    await pgClient.query(
      "INSERT INTO app.user_tenants (user_id, tenant_id, is_active, role) VALUES ($1, $2, $3, $4)",
      [testUserId, testTenantId, true, "member"]
    )
    console.log("✅ User-Tenant-Zuordnung erstellt (is_active = true)")

    // ============================================
    // Schritt 4: Auth Hook simulieren (is_active = true)
    // ============================================
    console.log("\n4️⃣  Teste Auth Hook Logik (is_active = true)...")
    // Teste direkt die Logik der Auth Hook Funktion
    const activeCheckResult = await pgClient.query(
      `SELECT ut.tenant_id 
       FROM app.user_tenants ut
       WHERE ut.user_id = $1
         AND ut.is_active = true
       ORDER BY ut.created_at ASC
       LIMIT 1`,
      [testUserId]
    )

    if (activeCheckResult.rows.length > 0 && activeCheckResult.rows[0].tenant_id === testTenantId) {
      console.log("✅ Aktiver User hat Tenant-Zuordnung (tenant_id vorhanden)")
    } else {
      throw new Error("❌ Aktiver User sollte Tenant-Zuordnung haben")
    }

    // ============================================
    // Schritt 5: Helper-Funktion testen (is_active = true)
    // ============================================
    console.log("\n5️⃣  Teste Helper-Funktion (is_active = true)...")
    const helperActiveResult = await pgClient.query(
      "SELECT app.is_user_active_in_tenant($1, $2) as is_active",
      [testUserId, testTenantId]
    )

    const helperActive = helperActiveResult.rows[0].is_active

    if (helperActive === true) {
      console.log("✅ Helper-Funktion: User ist aktiv (true)")
    } else {
      throw new Error(`❌ Helper-Funktion sollte true zurückgeben, bekam: ${helperActive}`)
    }

    // ============================================
    // Schritt 6: User deaktivieren (is_active = false)
    // ============================================
    console.log("\n6️⃣  Deaktiviere User (is_active = false)...")
    await pgClient.query(
      "UPDATE app.user_tenants SET is_active = false WHERE user_id = $1 AND tenant_id = $2",
      [testUserId, testTenantId]
    )
    console.log("✅ User deaktiviert")

    // ============================================
    // Schritt 7: Auth Hook simulieren (is_active = false)
    // ============================================
    console.log("\n7️⃣  Teste Auth Hook Logik (is_active = false)...")
    const inactiveCheckResult = await pgClient.query(
      `SELECT ut.tenant_id 
       FROM app.user_tenants ut
       WHERE ut.user_id = $1
         AND ut.is_active = true
       ORDER BY ut.created_at ASC
       LIMIT 1`,
      [testUserId]
    )

    if (inactiveCheckResult.rows.length === 0) {
      console.log("✅ Inaktiver User hat KEINE aktive Tenant-Zuordnung (tenant_id NULL)")
    } else {
      throw new Error("❌ Inaktiver User sollte keine aktive Tenant-Zuordnung haben")
    }

    // ============================================
    // Schritt 8: Helper-Funktion testen (is_active = false)
    // ============================================
    console.log("\n8️⃣  Teste Helper-Funktion (is_active = false)...")
    const helperInactiveResult = await pgClient.query(
      "SELECT app.is_user_active_in_tenant($1, $2) as is_active",
      [testUserId, testTenantId]
    )

    const helperInactive = helperInactiveResult.rows[0].is_active

    if (helperInactive === false) {
      console.log("✅ Helper-Funktion: User ist inaktiv (false)")
    } else {
      throw new Error(`❌ Helper-Funktion sollte false zurückgeben, bekam: ${helperInactive}`)
    }

    // ============================================
    // Schritt 9: User reaktivieren (is_active = true)
    // ============================================
    console.log("\n9️⃣  Reaktiviere User (is_active = true)...")
    await pgClient.query(
      "UPDATE app.user_tenants SET is_active = true WHERE user_id = $1 AND tenant_id = $2",
      [testUserId, testTenantId]
    )
    console.log("✅ User reaktiviert")

    // ============================================
    // Schritt 10: Auth Hook simulieren (Reaktivierung)
    // ============================================
    console.log("\n🔟 Teste Auth Hook Logik (Reaktivierung)...")
    const reactivatedCheckResult = await pgClient.query(
      `SELECT ut.tenant_id 
       FROM app.user_tenants ut
       WHERE ut.user_id = $1
         AND ut.is_active = true
       ORDER BY ut.created_at ASC
       LIMIT 1`,
      [testUserId]
    )

    if (
      reactivatedCheckResult.rows.length > 0 &&
      reactivatedCheckResult.rows[0].tenant_id === testTenantId
    ) {
      console.log("✅ Reaktivierter User hat wieder Tenant-Zuordnung (tenant_id vorhanden)")
    } else {
      throw new Error("❌ Reaktivierter User sollte wieder Tenant-Zuordnung haben")
    }

    // ============================================
    // Schritt 11: Helper-Funktion testen (Reaktivierung)
    // ============================================
    console.log("\n1️⃣1️⃣  Teste Helper-Funktion (Reaktivierung)...")
    const helperReactivatedResult = await pgClient.query(
      "SELECT app.is_user_active_in_tenant($1, $2) as is_active",
      [testUserId, testTenantId]
    )

    const helperReactivated = helperReactivatedResult.rows[0].is_active

    if (helperReactivated === true) {
      console.log("✅ Helper-Funktion: User ist wieder aktiv (true)")
    } else {
      throw new Error(
        `❌ Helper-Funktion sollte true zurückgeben nach Reaktivierung, bekam: ${helperReactivated}`
      )
    }

    console.log("\n✅✅✅ ALLE TESTS BESTANDEN! ✅✅✅\n")
  } catch (error) {
    console.error("\n❌ Test fehlgeschlagen:", error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await cleanup()
  }
}

main()
