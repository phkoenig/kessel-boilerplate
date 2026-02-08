-- Migration: Cleanup Theme Preference
-- Entfernt die veraltete theme_preference Spalte
-- Ab jetzt wird nur noch selected_theme verwendet (Migration 024)

-- ============================================
-- 1. Spalte entfernen (falls vorhanden)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'theme_preference'
  ) THEN
    -- Entferne Index zuerst (falls vorhanden)
    DROP INDEX IF EXISTS idx_profiles_theme_preference;
    
    -- Entferne Spalte
    ALTER TABLE public.profiles 
      DROP COLUMN theme_preference;
  END IF;
END $$;

-- ============================================
-- HINWEIS:
-- Diese Migration entfernt die veraltete theme_preference Spalte.
-- Ab jetzt wird nur noch selected_theme verwendet (Migration 024).
-- 
-- Die DB-Funktionen get_admin_theme() und get_user_effective_theme()
-- aus Migration 024 bleiben erhalten und verwenden bereits selected_theme.
-- ============================================
