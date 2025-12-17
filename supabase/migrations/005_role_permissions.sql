-- Migration: Role Permissions Table
-- Speichert die Berechtigungen für Module/Seiten pro Rolle

-- Tabelle für Rollen-Berechtigungen
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  parent_id TEXT,
  admin_access BOOLEAN DEFAULT true,
  user_access BOOLEAN DEFAULT true,
  nouser_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kommentare
COMMENT ON TABLE role_permissions IS 'Speichert Zugriffsberechtigungen für Module und Seiten pro Rolle';
COMMENT ON COLUMN role_permissions.module_id IS 'Eindeutige ID des Moduls/der Seite';
COMMENT ON COLUMN role_permissions.module_name IS 'Anzeigename des Moduls/der Seite';
COMMENT ON COLUMN role_permissions.parent_id IS 'ID des übergeordneten Moduls (für Hierarchie)';
COMMENT ON COLUMN role_permissions.admin_access IS 'Admin hat Zugriff';
COMMENT ON COLUMN role_permissions.user_access IS 'Eingeloggte User haben Zugriff';
COMMENT ON COLUMN role_permissions.nouser_access IS 'Nicht eingeloggte User haben Zugriff';

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON role_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_parent_id ON role_permissions(parent_id);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trigger_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- RLS aktivieren
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies: Nur Admins können Berechtigungen ändern, alle können lesen
CREATE POLICY "Alle können Berechtigungen lesen"
  ON role_permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Nur Admins können Berechtigungen erstellen"
  ON role_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Nur Admins können Berechtigungen aktualisieren"
  ON role_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Nur Admins können Berechtigungen löschen"
  ON role_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

