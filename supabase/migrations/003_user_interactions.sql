CREATE TABLE public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interactions_session_created 
ON public.user_interactions(session_id, created_at DESC);

ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to interactions" 
ON public.user_interactions FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION cleanup_old_interactions()
RETURNS TRIGGER AS $$
DECLARE
  interaction_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO interaction_count
  FROM public.user_interactions WHERE session_id = NEW.session_id;
  
  IF interaction_count > 50 THEN
    DELETE FROM public.user_interactions
    WHERE id IN (
      SELECT id FROM public.user_interactions
      WHERE session_id = NEW.session_id
      ORDER BY created_at ASC LIMIT (interaction_count - 50)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_old_interactions
AFTER INSERT ON public.user_interactions
FOR EACH ROW EXECUTE FUNCTION cleanup_old_interactions();

GRANT SELECT, INSERT ON public.user_interactions TO anon, authenticated;
