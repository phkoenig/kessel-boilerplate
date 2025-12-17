-- Supabase Vault Setup für Secrets Management
-- Diese Migration muss im Supabase SQL Editor ausgeführt werden

-- Schritt 1: Vault Extension aktivieren
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Schritt 2: Vault-Funktionen erstellen

-- Funktion 1: insert_secret
CREATE OR REPLACE FUNCTION insert_secret(name TEXT, secret TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  RETURN vault.create_secret(secret, name);
END;
$$;

-- Funktion 2: read_secret
CREATE OR REPLACE FUNCTION read_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret TEXT;
BEGIN
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  SELECT decrypted_secret FROM vault.decrypted_secrets
  WHERE name = secret_name INTO secret;
  RETURN secret;
END;
$$;

-- Funktion 3: delete_secret
CREATE OR REPLACE FUNCTION delete_secret(secret_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  DELETE FROM vault.secrets WHERE name = secret_name;
END;
$$;

-- Funktion 4: get_all_secrets_for_env (für pull-env Skript)
CREATE OR REPLACE FUNCTION get_all_secrets_for_env()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  
  -- Alle Secrets als JSON-Objekt zurückgeben
  SELECT jsonb_object_agg(name, decrypted_secret)
  INTO result
  FROM vault.decrypted_secrets;
  
  RETURN result;
END;
$$;

-- 🔒 KRITISCH: Funktionen absichern (REVOKE-Statements)
-- Diese Statements sind ZWINGEND erforderlich für die Sicherheit!

REVOKE EXECUTE ON FUNCTION insert_secret(TEXT, TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION read_secret(TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION delete_secret(TEXT) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_all_secrets_for_env() FROM public, anon, authenticated;

-- Verifikation: Prüfe, wer die Funktionen ausführen darf
-- (Sollte nur service_role sein)
-- SELECT 
--   routine_name,
--   grantee,
--   privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('insert_secret', 'read_secret', 'delete_secret', 'get_all_secrets_for_env');

