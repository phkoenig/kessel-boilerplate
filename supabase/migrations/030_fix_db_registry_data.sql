-- ============================================
-- Migration: Fix db_registry data and FK constraint
-- Fügt fehlende Einträge hinzu und richtet FK-Constraint ein
-- ============================================

-- 1. Füge alle möglichen db_registry Einträge hinzu
-- KESSEL (verschiedene ID-Varianten)
INSERT INTO db_registry (id, name, description, is_default, connection_type)
VALUES ('kessel', 'Infra-DB (KESSEL)', 'Zentrale Infrastruktur-Datenbank', true, 'supabase')
ON CONFLICT (id) DO NOTHING;

INSERT INTO db_registry (id, name, description, is_default, connection_type)
VALUES ('infra-kessel', 'Infra-DB (KESSEL)', 'Zentrale Infrastruktur-Datenbank (Legacy)', false, 'supabase')
ON CONFLICT (id) DO NOTHING;

-- MegaBrain (verschiedene ID-Varianten)
INSERT INTO db_registry (id, name, description, is_default, connection_type, env_url_key, env_anon_key)
VALUES ('megabrain', 'MegaBrain-DB', 'Galaxy-Projektdaten', false, 'supabase', 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_URL', 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_ANON_KEY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO db_registry (id, name, description, is_default, connection_type, env_url_key, env_anon_key)
VALUES ('app-megabrain', 'MegaBrain-DB (Legacy)', 'Galaxy-Projektdaten (Legacy)', false, 'supabase', 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_URL', 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_ANON_KEY')
ON CONFLICT (id) DO NOTHING;

-- 2. Aktualisiere ai_datasources Einträge ohne database_id auf 'kessel'
UPDATE ai_datasources SET database_id = 'kessel' WHERE database_id IS NULL;

-- 3. Versuche FK-Constraint hinzuzufügen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_ai_datasources_database'
    AND table_name = 'ai_datasources'
  ) THEN
    ALTER TABLE ai_datasources
    ADD CONSTRAINT fk_ai_datasources_database
    FOREIGN KEY (database_id) REFERENCES db_registry(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Versuche Unique Constraint hinzuzufügen (falls noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ai_datasources_unique_per_db'
    AND table_name = 'ai_datasources'
  ) THEN
    -- Erst alten Constraint entfernen
    ALTER TABLE ai_datasources 
    DROP CONSTRAINT IF EXISTS ai_datasources_table_schema_table_name_key;
    
    -- Neuen Constraint hinzufügen
    ALTER TABLE ai_datasources 
    ADD CONSTRAINT ai_datasources_unique_per_db 
    UNIQUE (database_id, table_schema, table_name);
  END IF;
END $$;
