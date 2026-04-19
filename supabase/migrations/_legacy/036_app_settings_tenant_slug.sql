-- ============================================
-- Migration: App Settings Multi-Tenant Support
-- Fügt tenant_slug Spalte hinzu, damit jede App eigene Settings haben kann
-- ============================================

-- 1. Singleton-Constraint entfernen
ALTER TABLE public.app_settings 
  DROP CONSTRAINT IF EXISTS app_settings_singleton;

-- 2. tenant_slug Spalte hinzufügen
ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS tenant_slug TEXT;

-- 3. Bestehende Zeile(n) auf 'default' setzen falls tenant_slug NULL
UPDATE public.app_settings 
SET tenant_slug = 'default' 
WHERE tenant_slug IS NULL;

-- 4. NOT NULL Constraint hinzufügen
ALTER TABLE public.app_settings 
  ALTER COLUMN tenant_slug SET NOT NULL;

-- 5. Default-Wert für neue Einträge
ALTER TABLE public.app_settings 
  ALTER COLUMN tenant_slug SET DEFAULT 'default';

-- 6. Unique Index auf tenant_slug (ersetzt den Singleton-Ansatz)
DROP INDEX IF EXISTS idx_app_settings_singleton;
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_settings_tenant_slug 
  ON public.app_settings(tenant_slug);

-- 7. id-Spalte muss nicht mehr die feste UUID sein - generiere UUIDs für neue Einträge
ALTER TABLE public.app_settings 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Kommentar aktualisieren
COMMENT ON TABLE public.app_settings IS 
  'App-Branding-Einstellungen pro Tenant/App (identifiziert durch tenant_slug)';
COMMENT ON COLUMN public.app_settings.tenant_slug IS 
  'Eindeutiger Identifier der App (z.B. pdf_mega_service, galaxy, company_data)';

-- ============================================
-- HINWEIS:
-- - Jede App nutzt NEXT_PUBLIC_TENANT_SLUG als Identifier
-- - API filtert nach tenant_slug statt fester UUID
-- - Alte Singleton-Daten bleiben unter tenant_slug='default'
-- ============================================
