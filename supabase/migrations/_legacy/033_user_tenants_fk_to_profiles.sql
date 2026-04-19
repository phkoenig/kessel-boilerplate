-- Migration: Fix user_tenants FK for Clerk Auth
--
-- Problem: app.user_tenants.user_id referenziert auth.users(id),
-- aber mit Clerk Auth existieren neue Profile-IDs nicht mehr in auth.users.
-- Loesung: FK auf public.profiles(id) umstellen.

-- 1. Alten FK droppen
ALTER TABLE app.user_tenants
  DROP CONSTRAINT IF EXISTS user_tenants_user_id_fkey;

-- 2. Verwaiste Eintraege bereinigen
DELETE FROM app.user_tenants
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 3. Neuen FK auf profiles(id) setzen
ALTER TABLE app.user_tenants
  ADD CONSTRAINT user_tenants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT user_tenants_user_id_fkey ON app.user_tenants IS
  'Clerk Migration: Referenziert profiles(id) statt auth.users(id)';
