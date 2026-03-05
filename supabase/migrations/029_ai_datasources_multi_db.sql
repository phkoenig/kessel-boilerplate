-- ============================================
-- Migration: Multi-DB Support für ai_datasources
-- Erweitert ai_datasources um database_id für Multi-DB Support
-- ============================================

-- database_id Spalte hinzufügen (mit Default 'kessel' für bestehende Einträge)
ALTER TABLE ai_datasources 
ADD COLUMN IF NOT EXISTS database_id TEXT DEFAULT 'kessel';

-- Foreign Key zu db_registry
ALTER TABLE ai_datasources
DROP CONSTRAINT IF EXISTS fk_ai_datasources_database;

ALTER TABLE ai_datasources
ADD CONSTRAINT fk_ai_datasources_database
FOREIGN KEY (database_id) REFERENCES db_registry(id) ON DELETE CASCADE;

-- Unique Constraint anpassen (Tabelle muss pro DB eindeutig sein)
-- Alten Constraint entfernen (falls vorhanden)
ALTER TABLE ai_datasources 
DROP CONSTRAINT IF EXISTS ai_datasources_table_schema_table_name_key;

-- Neuen Constraint hinzufügen (pro DB eindeutig)
ALTER TABLE ai_datasources 
ADD CONSTRAINT ai_datasources_unique_per_db 
UNIQUE (database_id, table_schema, table_name);

-- Index für schnelle DB-Filterung
CREATE INDEX IF NOT EXISTS idx_ai_datasources_database ON ai_datasources(database_id);

-- Kommentar hinzufügen
COMMENT ON COLUMN ai_datasources.database_id IS 'Referenz zur db_registry Tabelle. Bestimmt, aus welcher DB die Tabelle kommt.';
