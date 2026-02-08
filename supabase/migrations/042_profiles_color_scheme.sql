-- Migration: Profiles Color Scheme
-- Fügt color_scheme Spalte zur profiles Tabelle hinzu
-- Speichert Dark/Light Mode Präferenz des Users (global über alle Apps)

-- ============================================
-- 1. Spalte hinzufügen (falls nicht vorhanden)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'color_scheme'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN color_scheme TEXT DEFAULT 'system'
      CHECK (color_scheme IN ('dark', 'light', 'system'));
  END IF;
END $$;

-- ============================================
-- 2. Kommentar hinzufügen
-- ============================================

COMMENT ON COLUMN public.profiles.color_scheme IS 
  'Dark/Light Mode Präferenz des Users, global über alle Apps (dark | light | system). Wird von next-themes verwendet.';

-- ============================================
-- 3. Index für schnelle Lookups (optional)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_color_scheme 
  ON public.profiles(color_scheme);

-- ============================================
-- HINWEIS:
-- Diese Spalte speichert die Dark/Light Mode Präferenz des Users.
-- Sie ist getrennt von selected_theme (Brand/Design System Theme).
-- 
-- Werte:
-- - 'dark': Immer Dark Mode
-- - 'light': Immer Light Mode  
-- - 'system': Folgt System-Präferenz (Standard)
-- ============================================
