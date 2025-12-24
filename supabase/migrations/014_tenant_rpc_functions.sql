-- ============================================
-- Migration: Tenant RPC Functions
-- ============================================
-- 
-- Erstellt RPC-Funktionen für Tenant-Management,
-- die auch ohne PostgREST Schema-Konfiguration funktionieren.

-- Funktion: Tenant erstellen
CREATE OR REPLACE FUNCTION infra.create_tenant(
  p_slug TEXT,
  p_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO app.tenants (slug, name)
  VALUES (p_slug, p_name)
  ON CONFLICT (slug) DO UPDATE SET name = p_name
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$;

-- Funktion: Tenant nach Slug abrufen
CREATE OR REPLACE FUNCTION infra.get_tenant_by_slug(
  p_slug TEXT
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.slug, t.name, t.created_at, t.updated_at
  FROM app.tenants t
  WHERE t.slug = p_slug;
END;
$$;

-- Funktion: User zu Tenant zuordnen
CREATE OR REPLACE FUNCTION infra.assign_user_to_tenant(
  p_user_id UUID,
  p_tenant_id UUID,
  p_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO app.user_tenants (user_id, tenant_id, role)
  VALUES (p_user_id, p_tenant_id, p_role)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = p_role;
  
  RETURN TRUE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION infra.create_tenant(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION infra.get_tenant_by_slug(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION infra.assign_user_to_tenant(UUID, UUID, TEXT) TO authenticated, anon;

-- Kommentare
COMMENT ON FUNCTION infra.create_tenant IS 'Erstellt einen neuen Tenant oder aktualisiert einen bestehenden';
COMMENT ON FUNCTION infra.get_tenant_by_slug IS 'Ruft einen Tenant nach Slug ab';
COMMENT ON FUNCTION infra.assign_user_to_tenant IS 'Ordnet einen User einem Tenant zu';

