-- ============================================
-- Migration: tenant_id Spalten hinzufügen
-- Fügt tenant_id Spalte zu allen tenant-fähigen Tabellen hinzu
-- ============================================

-- ============================================
-- 1. profiles.tenant_id
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES app.tenants(id) ON DELETE CASCADE;

-- Index für tenant_id
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- ============================================
-- 2. bugs.tenant_id
-- ============================================

ALTER TABLE public.bugs
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES app.tenants(id) ON DELETE CASCADE;

-- Index für tenant_id
CREATE INDEX IF NOT EXISTS idx_bugs_tenant_id ON public.bugs(tenant_id);

-- ============================================
-- 3. features.tenant_id
-- ============================================

ALTER TABLE public.features
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES app.tenants(id) ON DELETE CASCADE;

-- Index für tenant_id
CREATE INDEX IF NOT EXISTS idx_features_tenant_id ON public.features(tenant_id);

-- ============================================
-- 4. feature_votes.tenant_id
-- ============================================

ALTER TABLE public.feature_votes
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES app.tenants(id) ON DELETE CASCADE;

-- Index für tenant_id
CREATE INDEX IF NOT EXISTS idx_feature_votes_tenant_id ON public.feature_votes(tenant_id);

-- ============================================
-- 5. user_interactions.tenant_id
-- ============================================

ALTER TABLE public.user_interactions
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES app.tenants(id) ON DELETE CASCADE;

-- Index für tenant_id
CREATE INDEX IF NOT EXISTS idx_user_interactions_tenant_id ON public.user_interactions(tenant_id);

-- ============================================
-- 6. Trigger-Funktion: set_tenant_id()
-- ============================================

-- Diese Funktion setzt tenant_id automatisch aus dem JWT, wenn nicht gesetzt
CREATE OR REPLACE FUNCTION app.set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Wenn tenant_id nicht gesetzt ist, hole es aus dem JWT
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := app.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Kommentar
COMMENT ON FUNCTION app.set_tenant_id() IS 'Trigger-Funktion: Setzt tenant_id automatisch aus JWT, wenn nicht explizit gesetzt.';

-- ============================================
-- 7. Trigger auf Tabellen anwenden
-- ============================================

-- profiles
DROP TRIGGER IF EXISTS set_tenant_id_before_insert_profiles ON public.profiles;
CREATE TRIGGER set_tenant_id_before_insert_profiles
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION app.set_tenant_id();

-- bugs
DROP TRIGGER IF EXISTS set_tenant_id_before_insert_bugs ON public.bugs;
CREATE TRIGGER set_tenant_id_before_insert_bugs
  BEFORE INSERT ON public.bugs
  FOR EACH ROW
  EXECUTE FUNCTION app.set_tenant_id();

-- features
DROP TRIGGER IF EXISTS set_tenant_id_before_insert_features ON public.features;
CREATE TRIGGER set_tenant_id_before_insert_features
  BEFORE INSERT ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION app.set_tenant_id();

-- feature_votes
DROP TRIGGER IF EXISTS set_tenant_id_before_insert_feature_votes ON public.feature_votes;
CREATE TRIGGER set_tenant_id_before_insert_feature_votes
  BEFORE INSERT ON public.feature_votes
  FOR EACH ROW
  EXECUTE FUNCTION app.set_tenant_id();

-- user_interactions
DROP TRIGGER IF EXISTS set_tenant_id_before_insert_user_interactions ON public.user_interactions;
CREATE TRIGGER set_tenant_id_before_insert_user_interactions
  BEFORE INSERT ON public.user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION app.set_tenant_id();

-- ============================================
-- HINWEIS:
-- - Alle Tabellen haben jetzt tenant_id Spalten
-- - Trigger setzen tenant_id automatisch aus JWT bei INSERT
-- - Indizes wurden für Performance erstellt
-- - tenant_id ist nullable, damit bestehende Daten nicht brechen
-- ============================================

