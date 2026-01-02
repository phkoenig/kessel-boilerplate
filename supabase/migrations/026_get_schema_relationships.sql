-- ============================================
-- Migration: get_schema_relationships RPC
-- Liefert Foreign-Key-Beziehungen für dynamischen Tree-View
-- ============================================

CREATE OR REPLACE FUNCTION get_schema_relationships()
RETURNS TABLE (
  parent_table TEXT,
  child_table TEXT,
  constraint_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.relname::TEXT AS parent_table,
    ct.relname::TEXT AS child_table,
    con.conname::TEXT AS constraint_name
  FROM pg_catalog.pg_constraint con
  INNER JOIN pg_catalog.pg_class ct ON con.conrelid = ct.oid
  INNER JOIN pg_catalog.pg_class cl ON con.confrelid = cl.oid
  INNER JOIN pg_catalog.pg_namespace n ON ct.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND con.contype = 'f'; -- 'f' = foreign key
END;
$$;

COMMENT ON FUNCTION get_schema_relationships IS 'Liefert alle Foreign-Key-Beziehungen im public Schema für den dynamischen Tree-View';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_schema_relationships TO authenticated;
GRANT EXECUTE ON FUNCTION get_schema_relationships TO service_role;
