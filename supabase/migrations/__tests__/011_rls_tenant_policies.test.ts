/**
 * Tests für Migration 011: RLS Tenant Policies
 * ============================================
 *
 * Testet die Migration:
 * - Alte Policies werden entfernt
 * - Neue tenant-basierte Policies werden erstellt
 * - Admin-Override Policies existieren
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("Migration 011: RLS Tenant Policies", () => {
  const migrationPath = join(__dirname, "..", "011_rls_tenant_policies.sql")
  const migrationSQL = readFileSync(migrationPath, "utf-8")

  describe("Alte Policies entfernen", () => {
    it("sollte alte profiles Policies entfernen", () => {
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Users can view own profile"')
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Users can update own profile"')
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Admins can view all profiles"')
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Admins can update all profiles"')
    })

    it("sollte alte bugs Policies entfernen", () => {
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Alle können Bugs lesen"')
      expect(migrationSQL).toContain(
        'DROP POLICY IF EXISTS "Authentifizierte User können Bugs erstellen"'
      )
    })

    it("sollte alte features Policies entfernen", () => {
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Alle können Features lesen"')
    })

    it("sollte alte feature_votes Policies entfernen", () => {
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Alle können Votes lesen"')
    })

    it("sollte alte user_interactions Policy entfernen", () => {
      expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Allow public access to interactions"')
    })
  })

  describe("Neue tenant-basierte Policies", () => {
    it("sollte tenant-basierte Policies für profiles erstellen", () => {
      expect(migrationSQL).toContain("tenant_isolation_profiles_select")
      expect(migrationSQL).toContain("tenant_isolation_profiles_insert")
      expect(migrationSQL).toContain("tenant_isolation_profiles_update")
      expect(migrationSQL).toContain("tenant_isolation_profiles_delete")
      expect(migrationSQL).toContain("app.current_tenant_id()")
    })

    it("sollte tenant-basierte Policies für bugs erstellen", () => {
      expect(migrationSQL).toContain("tenant_isolation_bugs_select")
      expect(migrationSQL).toContain("tenant_isolation_bugs_insert")
      expect(migrationSQL).toContain("tenant_isolation_bugs_update")
      expect(migrationSQL).toContain("tenant_isolation_bugs_delete")
    })

    it("sollte tenant-basierte Policies für features erstellen", () => {
      expect(migrationSQL).toContain("tenant_isolation_features_select")
      expect(migrationSQL).toContain("tenant_isolation_features_insert")
      expect(migrationSQL).toContain("tenant_isolation_features_update")
      expect(migrationSQL).toContain("tenant_isolation_features_delete")
    })

    it("sollte tenant-basierte Policies für feature_votes erstellen", () => {
      expect(migrationSQL).toContain("tenant_isolation_feature_votes_select")
      expect(migrationSQL).toContain("tenant_isolation_feature_votes_insert")
      expect(migrationSQL).toContain("tenant_isolation_feature_votes_delete")
    })

    it("sollte tenant-basierte Policies für user_interactions erstellen", () => {
      expect(migrationSQL).toContain("tenant_isolation_user_interactions_select")
      expect(migrationSQL).toContain("tenant_isolation_user_interactions_insert")
    })
  })

  describe("Admin-Override Policies", () => {
    it("sollte Admin-Override für profiles haben", () => {
      expect(migrationSQL).toContain("admins_can_view_all_profiles")
      expect(migrationSQL).toContain("admins_can_update_all_profiles")
    })

    it("sollte Admin-Override für bugs haben", () => {
      expect(migrationSQL).toContain("admins_can_manage_all_bugs")
    })

    it("sollte Admin-Override für features haben", () => {
      expect(migrationSQL).toContain("admins_can_manage_all_features")
    })
  })

  describe("Policy-Logik Validierung", () => {
    it("sollte app.current_tenant_id() in allen tenant-basierten Policies verwenden", () => {
      const tenantPolicies = migrationSQL.match(
        /tenant_isolation.*?USING.*?app\.current_tenant_id\(\)/gs
      )
      expect(tenantPolicies).toBeTruthy()
      expect(tenantPolicies?.length).toBeGreaterThan(0)
    })

    it("sollte WITH CHECK Klauseln für INSERT/UPDATE haben", () => {
      expect(migrationSQL).toContain("WITH CHECK (tenant_id = app.current_tenant_id())")
    })

    it("sollte Admin-Policies auf profiles.role prüfen", () => {
      expect(migrationSQL).toContain("p.role = 'admin'")
    })
  })
})
