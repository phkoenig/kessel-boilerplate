-- ============================================
-- Migration: PostgREST Role-Konfiguration zurücksetzen
-- ============================================
--
-- Problem: Migration 013 hat pgrst.db_schemas auf Role-Ebene
-- für authenticator gesetzt, was die Dashboard-Konfiguration überschreibt.
--
-- Lösung: RESET entfernt die Role-spezifische Einstellung,
-- sodass die Dashboard Exposed Schemas wieder greifen.

-- Zeige aktuelle Konfiguration (für Debugging)
DO $$
DECLARE
  config_record RECORD;
BEGIN
  FOR config_record IN 
    SELECT setrole::regrole as role, setconfig 
    FROM pg_db_role_setting 
    WHERE setrole::regrole = 'authenticator'::regrole
  LOOP
    RAISE NOTICE 'Aktuelle authenticator config: %', config_record.setconfig;
  END LOOP;
END $$;

-- RESET: Entferne Role-spezifische pgrst.db_schemas Einstellung
ALTER ROLE authenticator RESET pgrst.db_schemas;

-- Benachrichtige PostgREST, Schema-Cache neu zu laden
NOTIFY pgrst, 'reload schema';

-- Bestätigung
DO $$
BEGIN
  RAISE NOTICE '✓ pgrst.db_schemas für authenticator zurückgesetzt';
  RAISE NOTICE '✓ PostgREST Schema-Reload angefordert';
  RAISE NOTICE '  Dashboard Exposed Schemas sind jetzt maßgeblich';
END $$;

