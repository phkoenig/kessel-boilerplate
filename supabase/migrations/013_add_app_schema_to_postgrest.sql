-- ============================================
-- Migration: app-Schema zu PostgREST hinzufügen
-- ============================================
-- 
-- Fügt das app-Schema zur PostgREST-Konfiguration hinzu,
-- damit Tabellen über die REST API erreichbar sind.
-- 
-- WICHTIG: Diese Migration muss nach 009_rls_tenant_setup.sql ausgeführt werden.

-- Hole aktuelle db_schemas Konfiguration
-- WICHTIG: Auf Supabase Cloud funktioniert ALTER ROLE ... SET pgrst.db_schemas nicht.
-- Diese Konfiguration muss MANUELL im Dashboard gesetzt werden.
-- Siehe Kommentar unten für Anweisungen.

DO $$
DECLARE
  current_schemas TEXT;
  new_schemas TEXT;
BEGIN
  -- Hole aktuelle Konfiguration
  SELECT current_setting('pgrst.db_schemas', true) INTO current_schemas;
  
  -- Prüfe ob app bereits enthalten ist
  IF current_schemas IS NULL OR current_schemas = '' THEN
    -- Fallback: Standard-Schemas
    current_schemas := 'public, infra, storage, graphql_public, realtime';
  END IF;
  
  -- Prüfe ob app bereits enthalten ist
  IF current_schemas LIKE '%app%' THEN
    RAISE NOTICE 'app-Schema ist bereits in PostgREST-Konfiguration enthalten: %', current_schemas;
  ELSE
    -- Füge app hinzu
    new_schemas := current_schemas || ', app';
    
    -- WICHTIG: Auf Supabase Cloud wird diese Anweisung ignoriert!
    -- Die Konfiguration muss manuell im Dashboard gesetzt werden.
    -- ALTER ROLE authenticator SET pgrst.db_schemas = new_schemas; -- Funktioniert nur lokal
    
    -- PostgREST Reload (funktioniert nur lokal)
    -- PERFORM pg_notify('pgrst', 'reload config'); -- Funktioniert nur lokal
    
    RAISE NOTICE '⚠️  app-Schema muss manuell zu PostgREST-Konfiguration hinzugefügt werden!';
    RAISE NOTICE '    Gehe zu: Settings > Database > PostgREST > db_schemas';
    RAISE NOTICE '    Setze auf: %', new_schemas;
  END IF;
END $$;

-- Grants für PostgREST (authenticator Role)
GRANT USAGE ON SCHEMA app TO anon, authenticated;
GRANT SELECT ON app.tenants TO anon, authenticated;
GRANT SELECT ON app.user_tenants TO anon, authenticated;

-- ============================================
-- WICHTIG: PostgREST-Konfiguration auf Supabase Cloud
-- ============================================
-- 
-- Die obige ALTER ROLE Anweisung funktioniert nur lokal.
-- Auf Supabase Cloud muss db_schemas MANUELL im Dashboard gesetzt werden:
-- 
-- 1. Gehe zu: Settings > Database > PostgREST
-- 2. Setze db_schemas auf: public, infra, storage, graphql_public, realtime, app
-- 3. Speichere und warte 2-5 Minuten, bis PostgREST neu geladen hat
-- 
-- Die Grants oben sind korrekt und werden angewendet.
-- Nur die db_schemas Konfiguration muss manuell gemacht werden.
-- 
-- ============================================
-- HINWEIS:
-- - app-Schema ist jetzt in PostgREST verfügbar (nach manueller Konfiguration)
-- - Tabellen können über REST API erreichbar sein
-- - RLS Policies gelten weiterhin
-- ============================================

