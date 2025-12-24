/**
 * Tests für Migration 009: RLS Tenant Setup
 * ==========================================
 *
 * Testet die Tenant-Infrastruktur-Migration:
 * - app-Schema wird erstellt
 * - app.tenants Tabelle existiert
 * - app.user_tenants Junction-Tabelle existiert
 * - current_tenant_id() Funktion funktioniert
 * - custom_access_token_hook() Funktion existiert
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("Migration 009: RLS Tenant Setup", () => {
  const migrationPath = join(__dirname, "..", "009_rls_tenant_setup.sql")
  const migrationSQL = readFileSync(migrationPath, "utf-8")

  describe("SQL-Struktur Validierung", () => {
    it("sollte app-Schema erstellen", () => {
      expect(migrationSQL).toContain("CREATE SCHEMA IF NOT EXISTS app")
      expect(migrationSQL).toContain("COMMENT ON SCHEMA app")
    })

    it("sollte app.tenants Tabelle erstellen", () => {
      expect(migrationSQL).toContain("CREATE TABLE IF NOT EXISTS app.tenants")
      expect(migrationSQL).toContain("id UUID PRIMARY KEY")
      expect(migrationSQL).toContain("slug TEXT UNIQUE NOT NULL")
      expect(migrationSQL).toContain("name TEXT NOT NULL")
      expect(migrationSQL).toContain("created_at TIMESTAMPTZ")
    })

    it("sollte app.user_tenants Junction-Tabelle erstellen", () => {
      expect(migrationSQL).toContain("CREATE TABLE IF NOT EXISTS app.user_tenants")
      expect(migrationSQL).toContain("user_id UUID NOT NULL REFERENCES auth.users")
      expect(migrationSQL).toContain("tenant_id UUID NOT NULL REFERENCES app.tenants")
      expect(migrationSQL).toContain("PRIMARY KEY (user_id, tenant_id)")
      expect(migrationSQL).toContain("role TEXT NOT NULL DEFAULT 'member'")
    })

    it("sollte current_tenant_id() Funktion erstellen", () => {
      expect(migrationSQL).toContain("CREATE OR REPLACE FUNCTION app.current_tenant_id()")
      expect(migrationSQL).toContain("RETURNS UUID")
      expect(migrationSQL).toContain("LANGUAGE SQL")
      expect(migrationSQL).toContain("STABLE")
      expect(migrationSQL).toContain("request.jwt.claims")
      expect(migrationSQL).toContain("tenant_id")
    })

    it("sollte custom_access_token_hook() Funktion erstellen", () => {
      expect(migrationSQL).toContain("CREATE OR REPLACE FUNCTION app.custom_access_token_hook")
      expect(migrationSQL).toContain("event JSONB")
      expect(migrationSQL).toContain("RETURNS JSONB")
      expect(migrationSQL).toContain("LANGUAGE plpgsql")
      expect(migrationSQL).toContain("app.user_tenants")
    })

    it("sollte RLS Policies aktivieren", () => {
      expect(migrationSQL).toContain("ALTER TABLE app.tenants ENABLE ROW LEVEL SECURITY")
      expect(migrationSQL).toContain("ALTER TABLE app.user_tenants ENABLE ROW LEVEL SECURITY")
      expect(migrationSQL).toContain("CREATE POLICY")
      expect(migrationSQL).toContain("app.tenants")
      expect(migrationSQL).toContain("app.user_tenants")
      expect(migrationSQL).toContain("FOR SELECT")
    })

    it("sollte Indizes erstellen", () => {
      expect(migrationSQL).toContain("CREATE INDEX IF NOT EXISTS idx_tenants_slug")
      expect(migrationSQL).toContain("CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id")
      expect(migrationSQL).toContain("CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id")
    })

    it("sollte Grants für Auth Hook setzen", () => {
      expect(migrationSQL).toContain("GRANT USAGE ON SCHEMA app TO supabase_auth_admin")
      expect(migrationSQL).toContain("GRANT SELECT ON app.user_tenants TO supabase_auth_admin")
      expect(migrationSQL).toContain("GRANT EXECUTE ON FUNCTION app.custom_access_token_hook")
      expect(migrationSQL).toContain(
        "REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook(JSONB) FROM authenticated, anon, public"
      )
    })
  })

  describe("Funktions-Logik Validierung", () => {
    it("current_tenant_id() sollte JWT Claims lesen", () => {
      // Prüfe dass die Funktion request.jwt.claims verwendet
      const functionMatch = migrationSQL.match(
        /CREATE OR REPLACE FUNCTION app\.current_tenant_id\(\)[\s\S]*?AS \$\$([\s\S]*?)\$\$/
      )
      expect(functionMatch).toBeTruthy()
      if (functionMatch) {
        const functionBody = functionMatch[1]
        expect(functionBody).toContain("request.jwt.claims")
        expect(functionBody).toContain("tenant_id")
      }
    })

    it("custom_access_token_hook() sollte user_tenants Tabelle lesen", () => {
      const functionMatch = migrationSQL.match(
        /CREATE OR REPLACE FUNCTION app\.custom_access_token_hook[\s\S]*?AS \$\$([\s\S]*?)\$\$/
      )
      expect(functionMatch).toBeTruthy()
      if (functionMatch) {
        const functionBody = functionMatch[1]
        expect(functionBody).toContain("app.user_tenants")
        expect(functionBody).toContain("tenant_id")
        expect(functionBody).toContain("jsonb_set")
      }
    })
  })
})
