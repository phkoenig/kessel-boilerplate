-- Migration: Profiles Role Foreign Key
-- Stellt profiles.role von TEXT auf UUID Foreign Key um

-- ============================================
-- 1. Neue Spalte role_id hinzufügen
-- ============================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- ============================================
-- 2. Migration bestehender Daten
-- ============================================

-- Migriere bestehende role TEXT Werte zu role_id UUID
UPDATE profiles 
SET role_id = (
  SELECT id FROM roles 
  WHERE roles.name = profiles.role
)
WHERE role_id IS NULL 
  AND role IS NOT NULL;

-- Fallback: Wenn role nicht gefunden wird, setze auf 'user'
UPDATE profiles 
SET role_id = (
  SELECT id FROM roles 
  WHERE roles.name = 'user'
)
WHERE role_id IS NULL;

-- ============================================
-- 3. NOT NULL Constraint hinzufügen
-- ============================================

-- Erst sicherstellen, dass alle Einträge eine role_id haben
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id IS NULL;

-- Jetzt NOT NULL Constraint setzen
ALTER TABLE profiles 
  ALTER COLUMN role_id SET NOT NULL;

-- ============================================
-- 4. Index für schnelle Lookups
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

-- ============================================
-- 5. Alte role TEXT Spalte entfernen
-- ============================================
-- WICHTIG: Nur ausführen nach Verifizierung, dass alles funktioniert!
-- ALTER TABLE profiles DROP COLUMN role;

-- ============================================
-- HINWEIS:
-- Die alte 'role' Spalte bleibt vorerst erhalten für Rollback-Möglichkeit.
-- Nach erfolgreicher Verifizierung kann sie manuell entfernt werden:
-- ALTER TABLE profiles DROP COLUMN role;
-- ============================================

