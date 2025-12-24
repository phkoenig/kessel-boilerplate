-- ============================================
-- Migration: RLS Multi-Tenant Setup
-- Erstellt Tenant-Infrastruktur für Row-Level-Security basierte Multi-Tenancy
-- ============================================

-- ============================================
-- 1. app-Schema erstellen
-- ============================================

CREATE SCHEMA IF NOT EXISTS app;

-- Kommentar
COMMENT ON SCHEMA app IS 'Geschäftsdaten-Schema für Multi-Tenant-Architektur mit RLS';

-- ============================================
-- 2. Tenants Tabelle
-- ============================================

CREATE TABLE IF NOT EXISTS app.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kommentare
COMMENT ON TABLE app.tenants IS 'Zentrale Tenant-Registry für Multi-Tenant-Isolation';
COMMENT ON COLUMN app.tenants.slug IS 'Eindeutiger Slug für den Tenant (z.B. "galaxy", "nova")';
COMMENT ON COLUMN app.tenants.name IS 'Anzeigename des Tenants';

-- Indizes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON app.tenants(slug);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION app.update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_updated_at ON app.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON app.tenants
  FOR EACH ROW
  EXECUTE FUNCTION app.update_tenants_updated_at();

-- ============================================
-- 3. User-Tenants Junction-Tabelle (N:M)
-- ============================================

CREATE TABLE IF NOT EXISTS app.user_tenants (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Kommentare
COMMENT ON TABLE app.user_tenants IS 'Junction-Tabelle für User-Tenant-Zuordnungen (N:M)';
COMMENT ON COLUMN app.user_tenants.role IS 'Rolle des Users im Tenant: owner, admin, member';

-- Indizes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON app.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON app.user_tenants(tenant_id);

-- ============================================
-- 4. Helper-Funktion: current_tenant_id()
-- ============================================

CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb->>'tenant_id',
    ''
  )::UUID;
$$;

-- Kommentar
COMMENT ON FUNCTION app.current_tenant_id() IS 'Liest tenant_id aus JWT Claims. Wird in RLS Policies verwendet.';

-- ============================================
-- 5. Auth Hook Funktion (für Custom Access Token Hook)
-- ============================================

-- Diese Funktion wird vom Supabase Auth Hook aufgerufen
-- Sie liest den ersten Tenant eines Users und setzt ihn in die JWT Claims
CREATE OR REPLACE FUNCTION app.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims JSONB;
  user_id_val UUID;
  tenant_id_val UUID;
BEGIN
  -- Extrahiere user_id aus dem Event
  user_id_val := (event->>'user_id')::UUID;
  
  -- Hole den ersten Tenant des Users (oder NULL wenn kein Tenant zugeordnet)
  SELECT ut.tenant_id INTO tenant_id_val
  FROM app.user_tenants ut
  WHERE ut.user_id = user_id_val
  ORDER BY ut.created_at ASC
  LIMIT 1;
  
  -- Hole bestehende Claims
  claims := event->'claims';
  
  -- Setze tenant_id in die Claims (wenn vorhanden)
  IF tenant_id_val IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{tenant_id}',
      to_jsonb(tenant_id_val::TEXT)
    );
  END IF;
  
  -- Aktualisiere Claims im Event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grants für Auth Hook
-- Die Funktion muss von supabase_auth_admin aufgerufen werden können
GRANT USAGE ON SCHEMA app TO supabase_auth_admin;
GRANT SELECT ON app.user_tenants TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION app.custom_access_token_hook(JSONB) TO supabase_auth_admin;

-- Revoke von öffentlichen Rollen (Sicherheit)
REVOKE EXECUTE ON FUNCTION app.custom_access_token_hook(JSONB) FROM authenticated, anon, public;

-- Kommentar
COMMENT ON FUNCTION app.custom_access_token_hook(JSONB) IS 'Auth Hook: Setzt tenant_id in JWT Claims basierend auf user_tenants Tabelle. Muss im Supabase Dashboard als Custom Access Token Hook registriert werden.';

-- ============================================
-- 6. RLS für Tenant-Tabellen aktivieren
-- ============================================

-- Tenants: Alle authentifizierten User können Tenants sehen
ALTER TABLE app.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tenants"
  ON app.tenants FOR SELECT
  TO authenticated
  USING (true);

-- User-Tenants: User können nur ihre eigenen Zuordnungen sehen
ALTER TABLE app.user_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant assignments"
  ON app.user_tenants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- HINWEIS: 
-- - Nach dieser Migration existieren: app.tenants, app.user_tenants
-- - current_tenant_id() Funktion ist verfügbar für RLS Policies
-- - custom_access_token_hook() muss im Supabase Dashboard registriert werden:
--   Authentication > Hooks > Custom Access Token Hook
--   URL: (wird später konfiguriert, wenn Edge Function erstellt wird)
--   ODER: SQL-basierter Hook direkt in der Datenbank (siehe Supabase Docs)
-- ============================================

