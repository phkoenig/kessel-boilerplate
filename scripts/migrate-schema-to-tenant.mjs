#!/usr/bin/env node

/**
 * Migration Script: Schema-basiert → RLS-basiert
 * ===============================================
 *
 * Migriert ein bestehendes Projekt von der Schema-basierten
 * auf die RLS-basierte Multi-Tenant-Architektur.
 *
 * Verwendung:
 *   node scripts/migrate-schema-to-tenant.mjs <slug> <name>
 *
 * Beispiel:
 *   node scripts/migrate-schema-to-tenant.mjs galaxy "Galaxy App"
 *   node scripts/migrate-schema-to-tenant.mjs treebuilder "TreeBuilder"
 */

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
  console.error("❌ Fehler: NEXT_PUBLIC_SUPABASE_URL und SERVICE_ROLE_KEY müssen gesetzt sein")
  process.exit(1)
}

// Argumente
const slug = process.argv[2]
const name = process.argv[3]

if (!slug) {
  console.error("❌ Fehler: Tenant-Slug erforderlich")
  console.error("")
  console.error("Verwendung:")
  console.error("  node scripts/migrate-schema-to-tenant.mjs <slug> <name>")
  console.error("")
  console.error("Beispiel:")
  console.error('  node scripts/migrate-schema-to-tenant.mjs galaxy "Galaxy App"')
  process.exit(1)
}

const tenantName = name || slug.charAt(0).toUpperCase() + slug.slice(1)

// Supabase Clients
const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const infraClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "infra",
  },
})

async function migrateTenant() {
  console.log(`\n🔄 Migration: ${slug} → RLS-Tenant\n`)
  console.log("=".repeat(60))

  let tenantId = null

  // Schritt 1: Tenant erstellen/prüfen
  console.log("\n📋 Schritt 1: Tenant erstellen")
  console.log("-".repeat(60))

  try {
    // Prüfe ob Tenant existiert
    const { data: existing } = await infraClient.rpc("get_tenant_by_slug", {
      p_slug: slug,
    })

    if (existing && existing.length > 0) {
      tenantId = existing[0].id
      console.log(`✓ Tenant "${slug}" existiert bereits: ${tenantId}`)
    } else {
      // Erstelle Tenant
      const { data: newTenantId, error } = await infraClient.rpc("create_tenant", {
        p_slug: slug,
        p_name: tenantName,
      })

      if (error) {
        console.error(`❌ Fehler beim Erstellen:`, error)
        throw error
      }

      tenantId = newTenantId
      console.log(`✓ Tenant "${slug}" erstellt: ${tenantId}`)
    }
  } catch (error) {
    console.error(`❌ Fehler bei Tenant-Erstellung:`, error.message)
    throw error
  }

  // Schritt 2: Standard-User zuordnen
  console.log("\n📋 Schritt 2: User zu Tenant zuordnen")
  console.log("-".repeat(60))

  const standardUsers = ["admin@local", "user@local"]

  for (const email of standardUsers) {
    try {
      // Finde User
      const { data: users } = await supabaseClient.auth.admin.listUsers()
      const user = users?.users?.find((u) => u.email === email)

      if (!user) {
        console.log(`⚠️  User "${email}" nicht gefunden - überspringe`)
        continue
      }

      // Ordne zu Tenant zu
      const { error } = await infraClient.rpc("assign_user_to_tenant", {
        p_user_id: user.id,
        p_tenant_id: tenantId,
        p_role: email.includes("admin") ? "owner" : "member",
      })

      if (error) {
        console.log(`⚠️  Fehler bei ${email}:`, error.message)
      } else {
        console.log(
          `✓ ${email} → Tenant "${slug}" (${email.includes("admin") ? "owner" : "member"})`
        )
      }
    } catch (error) {
      console.log(`⚠️  Fehler bei ${email}:`, error.message)
    }
  }

  // Schritt 3: tenant_id in bestehenden Daten setzen
  console.log("\n📋 Schritt 3: tenant_id in Daten setzen")
  console.log("-".repeat(60))

  const tables = ["profiles", "bugs", "features", "feature_votes", "user_interactions"]

  for (const table of tables) {
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .update({ tenant_id: tenantId })
        .is("tenant_id", null)
        .select("id")

      if (error) {
        // Tabelle existiert vielleicht nicht oder hat kein tenant_id
        console.log(`⚠️  ${table}: ${error.message}`)
      } else {
        const count = data?.length || 0
        if (count > 0) {
          console.log(`✓ ${table}: ${count} Datensätze aktualisiert`)
        } else {
          console.log(`✓ ${table}: keine Datensätze ohne tenant_id`)
        }
      }
    } catch (error) {
      console.log(`⚠️  ${table}: ${error.message}`)
    }
  }

  // Schritt 4: Alle Themes in tenant-Ordner kopieren
  console.log("\n📋 Schritt 4: Themes einrichten")
  console.log("-".repeat(60))

  try {
    // Liste alle Themes im Root
    const { data: rootThemes } = await supabaseClient.storage
      .from("themes")
      .list("", { limit: 100 })

    const cssThemes = rootThemes?.filter((f) => f.name.endsWith(".css")) || []

    if (cssThemes.length === 0) {
      console.log(`⚠️  Keine Themes im Root gefunden`)
    } else {
      console.log(`📦 ${cssThemes.length} Themes im Root gefunden`)

      // Liste existierende Themes im Tenant-Ordner
      const { data: existingThemes } = await supabaseClient.storage
        .from("themes")
        .list(slug, { limit: 100 })

      const existingNames = existingThemes?.map((f) => f.name) || []

      let copied = 0
      let skipped = 0

      // Kopiere jedes Theme
      for (const theme of cssThemes) {
        if (existingNames.includes(theme.name)) {
          skipped++
          continue
        }

        const { data: themeData } = await supabaseClient.storage.from("themes").download(theme.name)

        if (themeData) {
          const content = await themeData.text()
          const { error } = await supabaseClient.storage
            .from("themes")
            .upload(`${slug}/${theme.name}`, content, {
              contentType: "text/css",
              upsert: true,
            })

          if (!error) {
            copied++
          }
        }
      }

      console.log(`✓ ${copied} Themes kopiert, ${skipped} übersprungen`)

      // Stelle sicher dass default.css existiert
      const hasDefault =
        existingNames.includes("default.css") || cssThemes.some((t) => t.name === "default.css")

      if (!hasDefault && copied > 0) {
        // Kopiere perpetuity.css als default.css
        const { data: fallback } = await supabaseClient.storage
          .from("themes")
          .download(`${slug}/perpetuity.css`)

        if (fallback) {
          const content = await fallback.text()
          await supabaseClient.storage.from("themes").upload(`${slug}/default.css`, content, {
            contentType: "text/css",
            upsert: true,
          })
          console.log(`✓ default.css erstellt (aus perpetuity.css)`)
        }
      }
    }
  } catch (error) {
    console.log(`⚠️  Theme-Setup fehlgeschlagen: ${error.message}`)
  }

  // Zusammenfassung
  console.log("\n" + "=".repeat(60))
  console.log("✅ Migration abgeschlossen!")
  console.log("=".repeat(60))

  console.log(`
📝 Nächste Schritte für das Projekt-Verzeichnis:

1. .env.local aktualisieren:
   - NEXT_PUBLIC_PROJECT_SCHEMA=... → ENTFERNEN
   + NEXT_PUBLIC_TENANT_SLUG=${slug}

2. Supabase Client prüfen:
   - db: { schema: ... } → ENTFERNEN (falls vorhanden)

3. Auth Hook aktivieren (falls noch nicht):
   - Dashboard → Authentication → Hooks
   - Custom Access Token → Enable
   - Hook Type: Postgres Function
   - Schema: app
   - Function: custom_access_token_hook

4. Testen:
   node scripts/test-tenant-setup.mjs
`)

  return tenantId
}

// Ausführen
migrateTenant()
  .then((tenantId) => {
    console.log(`\n🎉 Tenant-ID: ${tenantId}\n`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`\n❌ Migration fehlgeschlagen:`, error.message)
    process.exit(1)
  })
