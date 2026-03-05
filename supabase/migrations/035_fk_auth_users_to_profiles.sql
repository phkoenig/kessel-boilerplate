-- Migration: FK auth.users -> profiles fuer Clerk Auth
--
-- Tabellen die auth.users referenzieren muessen auf profiles(id) umgestellt werden.

-- ============================================
-- 1. BUGS
-- ============================================
ALTER TABLE public.bugs
  DROP CONSTRAINT IF EXISTS bugs_reporter_id_fkey;

UPDATE public.bugs
SET reporter_id = NULL
WHERE reporter_id IS NOT NULL
  AND reporter_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.bugs
  ADD CONSTRAINT bugs_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 2. FEATURES
-- ============================================
ALTER TABLE public.features
  DROP CONSTRAINT IF EXISTS features_proposer_id_fkey;

UPDATE public.features
SET proposer_id = NULL
WHERE proposer_id IS NOT NULL
  AND proposer_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.features
  ADD CONSTRAINT features_proposer_id_fkey
  FOREIGN KEY (proposer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 3. FEATURE_VOTES
-- ============================================
ALTER TABLE public.feature_votes
  DROP CONSTRAINT IF EXISTS feature_votes_user_id_fkey;

DELETE FROM public.feature_votes
WHERE user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.feature_votes
  ADD CONSTRAINT feature_votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================
-- 4. AI_DATASOURCES (created_by)
-- ============================================
ALTER TABLE public.ai_datasources
  DROP CONSTRAINT IF EXISTS ai_datasources_created_by_fkey;

UPDATE public.ai_datasources
SET created_by = NULL
WHERE created_by IS NOT NULL
  AND created_by NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.ai_datasources
  ADD CONSTRAINT ai_datasources_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- 5. AI_TOOL_CALLS (user_id)
-- ============================================
ALTER TABLE public.ai_tool_calls
  DROP CONSTRAINT IF EXISTS ai_tool_calls_user_id_fkey;

UPDATE public.ai_tool_calls
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.ai_tool_calls
  ADD CONSTRAINT ai_tool_calls_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
