-- ============================================
-- Migration: Bug-Report + Feature-Wishlist fuer Clerk-IDs umstellen
-- Hintergrund: Mit dem V3-Umbau ist Clerk die alleinige Identity-Quelle.
-- Die Tabellen bugs / features / feature_votes speicherten bisher UUIDs aus
-- auth.users(id); unter Clerk sind das jedoch strings wie "user_xxx".
--
-- Diese Migration:
--   1. Droppt die alten Policies (sie referenzieren die Spalten → blocken ALTER).
--   2. Droppt die FKs auf auth.users.
--   3. Konvertiert die betroffenen Spalten auf TEXT.
--   4. Oeffnet die Policies, weil der Supabase-Client kein Clerk-JWT liefert
--      (Beispiel-Feature — Auth-Check liegt im Next-Layer).
-- Siehe docs/10_gaps/260419-boilerplate-db-agnostik-gap.md (#NEW-2).
-- ============================================

-- 1) Alte Policies droppen (blockieren sonst den Spalten-Typwechsel)
DROP POLICY IF EXISTS "Alle können Bugs lesen" ON public.bugs;
DROP POLICY IF EXISTS "Authentifizierte User können Bugs erstellen" ON public.bugs;
DROP POLICY IF EXISTS "Admins können Bugs aktualisieren" ON public.bugs;
DROP POLICY IF EXISTS "Admins können Bugs löschen" ON public.bugs;

DROP POLICY IF EXISTS "Alle können Features lesen" ON public.features;
DROP POLICY IF EXISTS "Authentifizierte User können Features erstellen" ON public.features;
DROP POLICY IF EXISTS "Admins können Features aktualisieren" ON public.features;
DROP POLICY IF EXISTS "Admins können Features löschen" ON public.features;

DROP POLICY IF EXISTS "Alle können Votes lesen" ON public.feature_votes;
DROP POLICY IF EXISTS "User können eigene Votes erstellen" ON public.feature_votes;
DROP POLICY IF EXISTS "User können eigene Votes löschen" ON public.feature_votes;

-- 2) FK droppen + Spaltentyp auf TEXT
ALTER TABLE public.bugs
  DROP CONSTRAINT IF EXISTS bugs_reporter_id_fkey;
ALTER TABLE public.bugs
  ALTER COLUMN reporter_id TYPE TEXT USING reporter_id::TEXT;
COMMENT ON COLUMN public.bugs.reporter_id IS
  'Clerk User ID (z.B. "user_xxx") oder NULL. Kein FK mehr — Clerk ist Single Source of Truth.';

ALTER TABLE public.features
  DROP CONSTRAINT IF EXISTS features_proposer_id_fkey;
ALTER TABLE public.features
  ALTER COLUMN proposer_id TYPE TEXT USING proposer_id::TEXT;
COMMENT ON COLUMN public.features.proposer_id IS
  'Clerk User ID oder NULL. Kein FK mehr.';

ALTER TABLE public.feature_votes
  DROP CONSTRAINT IF EXISTS feature_votes_user_id_fkey;
ALTER TABLE public.feature_votes
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
COMMENT ON COLUMN public.feature_votes.user_id IS
  'Clerk User ID. Kein FK mehr. UNIQUE(feature_id, user_id) bleibt aktiv.';

-- 3) Neue offene Policies
CREATE POLICY bugs_select_all ON public.bugs FOR SELECT USING (true);
CREATE POLICY bugs_insert_all ON public.bugs FOR INSERT WITH CHECK (true);
CREATE POLICY bugs_update_all ON public.bugs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY bugs_delete_all ON public.bugs FOR DELETE USING (true);

CREATE POLICY features_select_all ON public.features FOR SELECT USING (true);
CREATE POLICY features_insert_all ON public.features FOR INSERT WITH CHECK (true);
CREATE POLICY features_update_all ON public.features FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY features_delete_all ON public.features FOR DELETE USING (true);

CREATE POLICY feature_votes_select_all ON public.feature_votes FOR SELECT USING (true);
CREATE POLICY feature_votes_insert_all ON public.feature_votes FOR INSERT WITH CHECK (true);
CREATE POLICY feature_votes_delete_all ON public.feature_votes FOR DELETE USING (true);
