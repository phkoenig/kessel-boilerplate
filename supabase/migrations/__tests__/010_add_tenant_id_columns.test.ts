/**
 * Tests für Migration 010: tenant_id Spalten hinzufügen
 * ====================================================
 *
 * Testet die Migration:
 * - tenant_id Spalten werden zu allen Tabellen hinzugefügt
 * - Indizes werden erstellt
 * - Trigger-Funktion set_tenant_id() existiert
 * - Trigger werden auf alle Tabellen angewendet
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe("Migration 010: Add tenant_id Columns", () => {
  const migrationPath = join(__dirname, "..", "010_add_tenant_id_columns.sql")
  const migrationSQL = readFileSync(migrationPath, "utf-8")

  describe("SQL-Struktur Validierung", () => {
    it("sollte tenant_id zu profiles hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE public.profiles")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS tenant_id UUID")
      expect(migrationSQL).toContain("REFERENCES app.tenants(id)")
      expect(migrationSQL).toContain("idx_profiles_tenant_id")
    })

    it("sollte tenant_id zu bugs hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE public.bugs")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS tenant_id UUID")
      expect(migrationSQL).toContain("idx_bugs_tenant_id")
    })

    it("sollte tenant_id zu features hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE public.features")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS tenant_id UUID")
      expect(migrationSQL).toContain("idx_features_tenant_id")
    })

    it("sollte tenant_id zu feature_votes hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE public.feature_votes")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS tenant_id UUID")
      expect(migrationSQL).toContain("idx_feature_votes_tenant_id")
    })

    it("sollte tenant_id zu user_interactions hinzufügen", () => {
      expect(migrationSQL).toContain("ALTER TABLE public.user_interactions")
      expect(migrationSQL).toContain("ADD COLUMN IF NOT EXISTS tenant_id UUID")
      expect(migrationSQL).toContain("idx_user_interactions_tenant_id")
    })

    it("sollte set_tenant_id() Trigger-Funktion erstellen", () => {
      expect(migrationSQL).toContain("CREATE OR REPLACE FUNCTION app.set_tenant_id()")
      expect(migrationSQL).toContain("RETURNS TRIGGER")
      expect(migrationSQL).toContain("LANGUAGE plpgsql")
      expect(migrationSQL).toContain("app.current_tenant_id()")
    })

    it("sollte Trigger auf profiles anwenden", () => {
      expect(migrationSQL).toContain("CREATE TRIGGER set_tenant_id_before_insert_profiles")
      expect(migrationSQL).toContain("ON public.profiles")
      expect(migrationSQL).toContain("BEFORE INSERT")
      expect(migrationSQL).toContain("EXECUTE FUNCTION app.set_tenant_id()")
    })

    it("sollte Trigger auf bugs anwenden", () => {
      expect(migrationSQL).toContain("CREATE TRIGGER set_tenant_id_before_insert_bugs")
      expect(migrationSQL).toContain("ON public.bugs")
    })

    it("sollte Trigger auf features anwenden", () => {
      expect(migrationSQL).toContain("CREATE TRIGGER set_tenant_id_before_insert_features")
      expect(migrationSQL).toContain("ON public.features")
    })

    it("sollte Trigger auf feature_votes anwenden", () => {
      expect(migrationSQL).toContain("CREATE TRIGGER set_tenant_id_before_insert_feature_votes")
      expect(migrationSQL).toContain("ON public.feature_votes")
    })

    it("sollte Trigger auf user_interactions anwenden", () => {
      expect(migrationSQL).toContain("CREATE TRIGGER set_tenant_id_before_insert_user_interactions")
      expect(migrationSQL).toContain("ON public.user_interactions")
    })
  })

  describe("Funktions-Logik Validierung", () => {
    it("set_tenant_id() sollte current_tenant_id() verwenden", () => {
      const functionMatch = migrationSQL.match(
        /CREATE OR REPLACE FUNCTION app\.set_tenant_id\(\)[\s\S]*?AS \$\$([\s\S]*?)\$\$/
      )
      expect(functionMatch).toBeTruthy()
      if (functionMatch) {
        const functionBody = functionMatch[1]
        expect(functionBody).toContain("app.current_tenant_id()")
        expect(functionBody).toContain("NEW.tenant_id")
      }
    })
  })
})
