-- ============================================
-- Migration: User-Tenant Aktivierungs-Flag
-- Fügt is_active Spalte zu app.user_tenants hinzu
-- ============================================

-- ============================================
-- 1. Spalte hinzufügen
-- ============================================

ALTER TABLE app.user_tenants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Kommentar
COMMENT ON COLUMN app.user_tenants.is_active IS 'Ob der User in diesem Tenant aktiv ist. false = temporär deaktiviert (kein Zugriff auf Tenant-Daten).';

-- ============================================
-- 2. Index für Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_tenants_is_active 
ON app.user_tenants(is_active);

-- ============================================
-- 3. Auth Hook aktualisieren
-- ============================================

-- Aktualisiere custom_access_token_hook() um nur aktive Tenant-Zuordnungen zu berücksichtigen
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
  
  -- Hole den ersten AKTIVEN Tenant des Users (oder NULL wenn kein aktiver Tenant zugeordnet)
  SELECT ut.tenant_id INTO tenant_id_val
  FROM app.user_tenants ut
  WHERE ut.user_id = user_id_val
    AND ut.is_active = true  -- ← NEU: Nur aktive Tenant-Zuordnungen
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

-- Kommentar aktualisieren
COMMENT ON FUNCTION app.custom_access_token_hook(JSONB) IS 'Auth Hook: Setzt tenant_id in JWT Claims basierend auf AKTIVEN user_tenants Einträgen. Inaktive User (is_active=false) bekommen keinen tenant_id Claim.';

-- ============================================
-- 4. Helper-Funktion für RLS (optional)
-- ============================================

-- Funktion für explizite Prüfung ob User in Tenant aktiv ist
CREATE OR REPLACE FUNCTION app.is_user_active_in_tenant(user_uuid UUID, tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.user_tenants ut
    WHERE ut.user_id = user_uuid
      AND ut.tenant_id = tenant_uuid
      AND ut.is_active = true
  );
$$;

-- Kommentar
COMMENT ON FUNCTION app.is_user_active_in_tenant(UUID, UUID) IS 'Prüft ob ein User in einem Tenant aktiv ist. Kann in RLS Policies verwendet werden.';

-- Grant für authenticated users
GRANT EXECUTE ON FUNCTION app.is_user_active_in_tenant(UUID, UUID) TO authenticated;

-- ============================================
-- TEST: Verifikation der is_active Logik
-- ============================================
-- 
-- Test 1: Aktiver User bekommt tenant_id
-- INSERT INTO app.user_tenants (user_id, tenant_id, is_active) VALUES ('...', '...', true);
-- SELECT app.custom_access_token_hook('{"user_id": "...", "claims": {}}'::jsonb);
-- Erwartung: tenant_id ist im zurückgegebenen JSONB vorhanden
--
-- Test 2: Inaktiver User bekommt KEIN tenant_id
-- UPDATE app.user_tenants SET is_active = false WHERE user_id = '...' AND tenant_id = '...';
-- SELECT app.custom_access_token_hook('{"user_id": "...", "claims": {}}'::jsonb);
-- Erwartung: tenant_id ist NULL oder nicht im zurückgegebenen JSONB
--
-- Test 3: Reaktivierung funktioniert
-- UPDATE app.user_tenants SET is_active = true WHERE user_id = '...' AND tenant_id = '...';
-- SELECT app.custom_access_token_hook('{"user_id": "...", "claims": {}}'::jsonb);
-- Erwartung: tenant_id ist wieder im zurückgegebenen JSONB vorhanden
--
-- Test 4: Helper-Funktion prüft korrekt
-- SELECT app.is_user_active_in_tenant('...', '...');
-- Erwartung: true wenn is_active=true, false wenn is_active=false oder kein Eintrag existiert
-- ============================================
