-- ============================================
-- Migration: Fix Profiles RLS Recursion
-- ============================================
--
-- Problem: Die Admin-Policies in 011 verursachen infinite recursion,
-- weil sie profiles abfragen während sie auf profiles angewendet werden.
--
-- Lösung: Entferne die rekursiven Admin-Policies und nutze stattdessen
-- die roles-Tabelle für Admin-Checks, oder verwende SECURITY DEFINER Funktionen.

-- Entferne die rekursiven Admin-Policies
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;

-- Entferne alte Policies aus früheren Migrationen (falls vorhanden)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Entferne die einfachen tenant_isolation Policies für SELECT/UPDATE (werden neu erstellt)
DROP POLICY IF EXISTS "tenant_isolation_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolation_profiles_update" ON public.profiles;

-- Erstelle eine SECURITY DEFINER Funktion für Admin-Check (umgeht RLS)
CREATE OR REPLACE FUNCTION app.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.name = 'admin'
  );
$$;

-- Admin-Override Policies mit der neuen Funktion
CREATE POLICY "admins_can_view_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = app.current_tenant_id() 
    OR app.is_platform_admin()
  );

CREATE POLICY "admins_can_update_all_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    tenant_id = app.current_tenant_id()
    OR app.is_platform_admin()
  )
  WITH CHECK (
    tenant_id = app.current_tenant_id()
    OR app.is_platform_admin()
  );

-- Hinweis: Die tenant_isolation Policies für INSERT und DELETE bleiben unverändert,
-- da Admins keine Profile in fremden Tenants erstellen/löschen sollten.

COMMENT ON FUNCTION app.is_platform_admin IS 'Prüft ob der aktuelle User ein Platform-Admin ist (SECURITY DEFINER umgeht RLS)';

