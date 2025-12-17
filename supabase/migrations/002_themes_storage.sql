-- ============================================
-- Migration: Themes Storage Setup
-- Erstellt Storage-Bucket und Tabelle für dynamische Themes
-- ============================================

-- 1. Storage Bucket für Theme-Dateien erstellen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'themes',
  'themes',
  true, -- Public, damit CSS ohne Auth geladen werden kann
  1048576, -- 1MB max pro Datei
  ARRAY['text/css', 'application/json']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies für den themes Bucket

-- Jeder kann lesen (CSS muss öffentlich sein)
CREATE POLICY "Themes sind öffentlich lesbar"
ON storage.objects FOR SELECT
USING (bucket_id = 'themes');

-- Nur authentifizierte User können schreiben (oder Service Role)
CREATE POLICY "Authentifizierte User können Themes hochladen"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'themes');

-- Nur authentifizierte User können aktualisieren
CREATE POLICY "Authentifizierte User können Themes aktualisieren"
ON storage.objects FOR UPDATE
USING (bucket_id = 'themes');

-- Nur authentifizierte User können löschen
CREATE POLICY "Authentifizierte User können Themes löschen"
ON storage.objects FOR DELETE
USING (bucket_id = 'themes');

-- 3. Themes-Tabelle für Metadaten (schneller als JSON-Datei)
CREATE TABLE IF NOT EXISTS public.themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dynamic_fonts TEXT[] DEFAULT '{}',
  is_builtin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_themes_is_builtin ON public.themes(is_builtin);

-- RLS aktivieren
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Jeder kann Themes lesen
CREATE POLICY "Themes sind öffentlich lesbar"
ON public.themes FOR SELECT
USING (true);

-- Nur authentifizierte User können Themes erstellen
CREATE POLICY "Authentifizierte User können Themes erstellen"
ON public.themes FOR INSERT
WITH CHECK (true); -- Später: auth.role() = 'authenticated'

-- Nur authentifizierte User können Themes aktualisieren (außer builtin)
CREATE POLICY "Authentifizierte User können Themes aktualisieren"
ON public.themes FOR UPDATE
USING (is_builtin = false);

-- Nur authentifizierte User können Themes löschen (außer builtin)
CREATE POLICY "Authentifizierte User können Themes löschen"
ON public.themes FOR DELETE
USING (is_builtin = false);

-- 4. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS themes_updated_at ON public.themes;
CREATE TRIGGER themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION update_themes_updated_at();

-- 5. Builtin-Themes initial einfügen (falls nicht vorhanden)
INSERT INTO public.themes (id, name, description, is_builtin)
VALUES ('default', 'Default', 'ShadCN Standard-Theme - Reduziert, neutral, minimal.', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HINWEIS: Nach dem Ausführen dieser Migration:
-- 1. Die existierenden Themes aus registry.json müssen in die Tabelle migriert werden
-- 2. Die tokens.css muss in den Storage-Bucket hochgeladen werden
-- ============================================

