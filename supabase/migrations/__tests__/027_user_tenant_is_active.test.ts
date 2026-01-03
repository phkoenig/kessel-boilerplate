/**
 * Tests für Migration 027: User-Tenant Aktivierungs-Flag
 * =======================================================
 *
 * Testet die is_active Spalte in app.user_tenants:
 * - Spalte wird hinzugefügt mit DEFAULT true
 * - Index wird erstellt
 * - Auth Hook wird aktualisiert (berücksichtigt is_active)
 * - Helper-Funktion wird erstellt
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("Migration 027: User-Tenant Aktivierungs-Flag", () => {
  const migrationPath = join(__dirname, "..", "027_user_tenant_is_active.sql")
  const migrationSQL = readFileSync(migrationPath, "utf-8")

  describe("SQL-Struktur Validierung", () => {
    it("sollte is_active Spalte zu app.user_tenants hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE app.user_tenants")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS is_active")
      expect(migrationSQL).toContain("BOOLEAN NOT NULL DEFAULT true")
    })

    it("sollte Kommentar für is_active Spalte hinzufügen", () => {
      expect(migrationSQL).toContain("COMMENT ON COLUMN app.user_tenants.is_active")
      expect(migrationSQL).toContain("temporär deaktiviert")
    })

    it("sollte Index für is_active erstellen", () => {
      expect(migrationSQL).toContain("CREATE INDEX IF NOT EXISTS idx_user_tenants_is_active")
      expect(migrationSQL).toContain("ON app.user_tenants(is_active)")
    })

    it("sollte custom_access_token_hook() Funktion aktualisieren", () => {
      expect(migrationSQL).toContain("CREATE OR REPLACE FUNCTION app.custom_access_token_hook")
      expect(migrationSQL).toContain("AND ut.is_active = true")
    })

    it("sollte Helper-Funktion is_user_active_in_tenant() erstellen", () => {
      expect(migrationSQL).toContain("CREATE OR REPLACE FUNCTION app.is_user_active_in_tenant")
      expect(migrationSQL).toContain("RETURNS BOOLEAN")
      expect(migrationSQL).toContain("user_uuid UUID")
      expect(migrationSQL).toContain("tenant_uuid UUID")
    })

    it("sollte Grant für Helper-Funktion setzen", () => {
      expect(migrationSQL).toContain("GRANT EXECUTE ON FUNCTION app.is_user_active_in_tenant")
      expect(migrationSQL).toContain("TO authenticated")
    })
  })

  describe("Funktions-Logik Validierung", () => {
    it("custom_access_token_hook() sollte is_active prüfen", () => {
      const functionMatch = migrationSQL.match(
        /CREATE OR REPLACE FUNCTION app\.custom_access_token_hook[\s\S]*?AS \$\$([\s\S]*?)\$\$/
      )
      expect(functionMatch).toBeTruthy()
      if (functionMatch) {
        const functionBody = functionMatch[1]
        expect(functionBody).toContain("AND ut.is_active = true")
        expect(functionBody).toContain("FROM app.user_tenants ut")
      }
    })

    it("is_user_active_in_tenant() sollte is_active prüfen", () => {
      const functionMatch = migrationSQL.match(
        /CREATE OR REPLACE FUNCTION app\.is_user_active_in_tenant[\s\S]*?AS \$\$([\s\S]*?)\$\$/
      )
      expect(functionMatch).toBeTruthy()
      if (functionMatch) {
        const functionBody = functionMatch[1]
        expect(functionBody).toContain("is_active = true")
        expect(functionBody).toContain("EXISTS")
      }
    })

    it("custom_access_token_hook() Kommentar sollte is_active erwähnen", () => {
      expect(migrationSQL).toContain("COMMENT ON FUNCTION app.custom_access_token_hook")
      expect(migrationSQL).toContain("AKTIVEN user_tenants")
      expect(migrationSQL).toContain("is_active=false")
    })
  })

  describe("Test-Dokumentation", () => {
    it("sollte Test-Szenarien als Kommentare enthalten", () => {
      expect(migrationSQL).toContain("TEST: Verifikation der is_active Logik")
      expect(migrationSQL).toContain("Test 1: Aktiver User bekommt tenant_id")
      expect(migrationSQL).toContain("Test 2: Inaktiver User bekommt KEIN tenant_id")
      expect(migrationSQL).toContain("Test 3: Reaktivierung funktioniert")
      expect(migrationSQL).toContain("Test 4: Helper-Funktion prüft korrekt")
    })
  })
})
