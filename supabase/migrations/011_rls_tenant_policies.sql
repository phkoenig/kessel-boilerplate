-- ============================================
-- Migration: RLS Policies auf tenant_id umstellen
-- Ersetzt user-basierte Policies durch tenant-basierte Policies
-- ============================================

-- ============================================
-- 1. Alte Policies entfernen
-- ============================================

-- profiles: Alte Policies entfernen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- bugs: Alte Policies entfernen
DROP POLICY IF EXISTS "Alle können Bugs lesen" ON public.bugs;
DROP POLICY IF EXISTS "Authentifizierte User können Bugs erstellen" ON public.bugs;
DROP POLICY IF EXISTS "Admins können Bugs aktualisieren" ON public.bugs;
DROP POLICY IF EXISTS "Admins können Bugs löschen" ON public.bugs;

-- features: Alte Policies entfernen
DROP POLICY IF EXISTS "Alle können Features lesen" ON public.features;
DROP POLICY IF EXISTS "Authentifizierte User können Features erstellen" ON public.features;
DROP POLICY IF EXISTS "Admins können Features aktualisieren" ON public.features;
DROP POLICY IF EXISTS "Admins können Features löschen" ON public.features;

-- feature_votes: Alte Policies entfernen
DROP POLICY IF EXISTS "Alle können Votes lesen" ON public.feature_votes;
DROP POLICY IF EXISTS "User können eigene Votes erstellen" ON public.feature_votes;
DROP POLICY IF EXISTS "User können eigene Votes löschen" ON public.feature_votes;

-- user_interactions: Alte Policy entfernen
DROP POLICY IF EXISTS "Allow public access to interactions" ON public.user_interactions;

-- ============================================
-- 2. Neue tenant-basierte Policies: profiles
-- ============================================

-- Tenant-Isolation: User können nur Daten ihres Tenants sehen/bearbeiten
CREATE POLICY "tenant_isolation_profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

-- Admin-Override: Admins können alle Profile sehen (plattform-weit)
CREATE POLICY "admins_can_view_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "admins_can_update_all_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================
-- 3. Neue tenant-basierte Policies: bugs
-- ============================================

CREATE POLICY "tenant_isolation_bugs_select"
  ON public.bugs FOR SELECT
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_bugs_insert"
  ON public.bugs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_bugs_update"
  ON public.bugs FOR UPDATE
  TO authenticated
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_bugs_delete"
  ON public.bugs FOR DELETE
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

-- Admin-Override für bugs
CREATE POLICY "admins_can_manage_all_bugs"
  ON public.bugs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================
-- 4. Neue tenant-basierte Policies: features
-- ============================================

CREATE POLICY "tenant_isolation_features_select"
  ON public.features FOR SELECT
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_features_insert"
  ON public.features FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_features_update"
  ON public.features FOR UPDATE
  TO authenticated
  USING (tenant_id = app.current_tenant_id())
  WITH CHECK (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_features_delete"
  ON public.features FOR DELETE
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

-- Admin-Override für features
CREATE POLICY "admins_can_manage_all_features"
  ON public.features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================
-- 5. Neue tenant-basierte Policies: feature_votes
-- ============================================

CREATE POLICY "tenant_isolation_feature_votes_select"
  ON public.feature_votes FOR SELECT
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_feature_votes_insert"
  ON public.feature_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = app.current_tenant_id()
    AND auth.uid() = user_id
  );

CREATE POLICY "tenant_isolation_feature_votes_delete"
  ON public.feature_votes FOR DELETE
  TO authenticated
  USING (
    tenant_id = app.current_tenant_id()
    AND auth.uid() = user_id
  );

-- ============================================
-- 6. Neue tenant-basierte Policies: user_interactions
-- ============================================

CREATE POLICY "tenant_isolation_user_interactions_select"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (tenant_id = app.current_tenant_id());

CREATE POLICY "tenant_isolation_user_interactions_insert"
  ON public.user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = app.current_tenant_id());

-- ============================================
-- HINWEIS:
-- - Alle Policies verwenden jetzt app.current_tenant_id()
-- - Tenant-Isolation ist aktiviert für alle Tabellen
-- - Admin-Override Policies erlauben plattform-weiten Zugriff für Admins
-- - Policies sind restriktiv: ohne tenant_id im JWT kein Zugriff
-- ============================================

