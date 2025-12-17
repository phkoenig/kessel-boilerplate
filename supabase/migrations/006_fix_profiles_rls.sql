-- ============================================
-- Migration: Fix Profiles RLS Policies
-- Behebt die unendliche Rekursion in den Admin-Policies
-- ============================================

-- Lösche alle existierenden Policies für profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Neue, einfachere Policies ohne Rekursion

-- Jeder authentifizierte User kann alle Profile lesen
-- (Die Rolle wird dann im Code geprüft für sensible Operationen)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

-- Users können ihr eigenes Profil aktualisieren
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Insert ist nur für den Trigger erlaubt (SECURITY DEFINER)
-- Kein direkter Insert durch User

-- Admin-Operationen wie Rollen-Änderungen werden über
-- Service Role Key (API-Routes) oder Supabase Dashboard gemacht

-- ============================================
-- HINWEIS: 
-- - Alle authentifizierten User können Profile lesen (für User-Listen)
-- - Update ist nur für das eigene Profil erlaubt
-- - Admin-Operationen (andere User bearbeiten) gehen über API mit Service Role
-- ============================================

