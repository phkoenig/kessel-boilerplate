-- ============================================
-- Migration: Cleanup Legacy Database IDs
-- Vereinheitlicht database_id Werte und entfernt Legacy-Einträge
-- ============================================

-- 1. Vereinheitliche database_id in ai_datasources
UPDATE ai_datasources SET database_id = 'kessel' WHERE database_id = 'infra-kessel';
UPDATE ai_datasources SET database_id = 'megabrain' WHERE database_id = 'app-megabrain';

-- 2. Entferne Legacy-Einträge aus db_registry
DELETE FROM db_registry WHERE id = 'infra-kessel';
DELETE FROM db_registry WHERE id = 'app-megabrain';
