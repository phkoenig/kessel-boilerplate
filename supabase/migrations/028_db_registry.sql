-- ============================================
-- Migration: Database Registry
-- Verwaltet registrierte Datenbanken für Multi-DB Support
-- ============================================

-- Tabelle für registrierte Datenbanken
CREATE TABLE IF NOT EXISTS public.db_registry (
  id TEXT PRIMARY KEY,                    -- 'kessel', 'megabrain', etc.
  name TEXT NOT NULL,                     -- 'Infra-DB (KESSEL)'
  description TEXT,                       -- Optionale Beschreibung
  connection_type TEXT NOT NULL DEFAULT 'supabase',  -- 'supabase' | 'postgres'
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,       -- Nur eine DB kann default sein
  env_url_key TEXT,                       -- 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_URL'
  env_anon_key TEXT,                      -- 'NEXT_PUBLIC_MEGABRAIN_SUPABASE_ANON_KEY'
  env_service_key TEXT,                   -- Optional: Service Role Key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE db_registry IS 'Registrierte Datenbanken für Multi-DB Tool Registry';
COMMENT ON COLUMN db_registry.id IS 'Eindeutige ID der Datenbank (z.B. "kessel", "megabrain")';
COMMENT ON COLUMN db_registry.connection_type IS 'Verbindungstyp: supabase oder postgres';
COMMENT ON COLUMN db_registry.is_default IS 'Nur eine DB kann default sein (für Legacy-Code)';
COMMENT ON COLUMN db_registry.env_url_key IS 'Name der Environment-Variable für die URL (z.B. NEXT_PUBLIC_MEGABRAIN_SUPABASE_URL)';
COMMENT ON COLUMN db_registry.env_anon_key IS 'Name der Environment-Variable für den Anon Key';
COMMENT ON COLUMN db_registry.env_service_key IS 'Optional: Name der Environment-Variable für Service Role Key';

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_db_registry_enabled ON db_registry(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_db_registry_default ON db_registry(is_default) WHERE is_default = true;

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_db_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER db_registry_updated_at
  BEFORE UPDATE ON db_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_db_registry_updated_at();

-- RLS aktivieren
ALTER TABLE db_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Alle können lesen
CREATE POLICY "Alle können db_registry lesen" ON db_registry
  FOR SELECT USING (true);

-- Policy: Nur Admins können ändern
CREATE POLICY "Nur Admins können db_registry ändern" ON db_registry
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- KESSEL als Default eintragen
INSERT INTO db_registry (id, name, description, is_default, connection_type)
VALUES ('kessel', 'Infra-DB (KESSEL)', 'Zentrale Infrastruktur-Datenbank', true, 'supabase')
ON CONFLICT (id) DO NOTHING;
