-- ============================================
-- Migration: Bugs & Features Tabellen
-- Für Bug-Reports und Feature-Wishlist
-- ============================================

-- ============================================
-- 1. Bugs Tabelle
-- ============================================

CREATE TABLE IF NOT EXISTS public.bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'fixed')),
  browser_info TEXT,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kommentare
COMMENT ON TABLE public.bugs IS 'Bug-Reports von Benutzern';
COMMENT ON COLUMN public.bugs.severity IS 'Schweregrad: critical, high, medium, low';
COMMENT ON COLUMN public.bugs.status IS 'Status: open, in-progress, fixed';

-- Indizes
CREATE INDEX IF NOT EXISTS idx_bugs_status ON public.bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON public.bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_reporter_id ON public.bugs(reporter_id);

-- RLS aktivieren
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;

-- Policies für Bugs
CREATE POLICY "Alle können Bugs lesen"
  ON public.bugs FOR SELECT
  USING (true);

CREATE POLICY "Authentifizierte User können Bugs erstellen"
  ON public.bugs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Bugs aktualisieren"
  ON public.bugs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins können Bugs löschen"
  ON public.bugs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_bugs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bugs_updated_at ON public.bugs;
CREATE TRIGGER bugs_updated_at
  BEFORE UPDATE ON public.bugs
  FOR EACH ROW
  EXECUTE FUNCTION update_bugs_updated_at();

-- ============================================
-- 2. Features Tabelle
-- ============================================

CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'under-review', 'released')),
  proposer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kommentare
COMMENT ON TABLE public.features IS 'Feature-Wishlist von Benutzern';
COMMENT ON COLUMN public.features.status IS 'Status: planned, in-progress, under-review, released';

-- Indizes
CREATE INDEX IF NOT EXISTS idx_features_status ON public.features(status);
CREATE INDEX IF NOT EXISTS idx_features_proposer_id ON public.features(proposer_id);

-- RLS aktivieren
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Policies für Features
CREATE POLICY "Alle können Features lesen"
  ON public.features FOR SELECT
  USING (true);

CREATE POLICY "Authentifizierte User können Features erstellen"
  ON public.features FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins können Features aktualisieren"
  ON public.features FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins können Features löschen"
  ON public.features FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS features_updated_at ON public.features;
CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION update_features_updated_at();

-- ============================================
-- 3. Feature Votes Tabelle (Junction)
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

-- Kommentare
COMMENT ON TABLE public.feature_votes IS 'Votes für Features (ein Vote pro User pro Feature)';

-- Indizes
CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON public.feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON public.feature_votes(user_id);

-- RLS aktivieren
ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

-- Policies für Feature Votes
CREATE POLICY "Alle können Votes lesen"
  ON public.feature_votes FOR SELECT
  USING (true);

CREATE POLICY "User können eigene Votes erstellen"
  ON public.feature_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User können eigene Votes löschen"
  ON public.feature_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HINWEIS: Nach dieser Migration existieren:
-- - bugs: Bug-Reports
-- - features: Feature-Vorschläge
-- - feature_votes: User-Votes für Features
-- ============================================

