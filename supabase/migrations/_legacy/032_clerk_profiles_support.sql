-- Migration: Clerk Auth - Profiles Support
-- Fuegt clerk_user_id Spalte hinzu und loest FK zu auth.users fuer Clerk-Kompatibilitaet.
-- Bestehende Profiles behalten id. Neue Profiles (via Webhook) haben clerk_user_id.

-- 1. clerk_user_id Spalte hinzufuegen (nullable fuer bestehende Supabase-User)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
ON public.profiles(clerk_user_id)
WHERE clerk_user_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.clerk_user_id IS 'Clerk User ID (user_xxx) fuer Clerk Auth. NULL = Supabase-Auth-User.';

-- 2. FK zu auth.users entfernen - ermoeglicht Insert von Clerk-Usern ohne auth.users Eintrag
-- Bestehende Daten bleiben erhalten
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
