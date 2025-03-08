-- This migration ensures that the server_status and app_settings tables
-- are included in the generated TypeScript types

-- Update the server_status table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'server_status') THEN
    -- Add a comment to ensure it's included in the generated types
    COMMENT ON TABLE server_status IS 'Stores system metrics for server monitoring and admin dashboard';
  END IF;
END
$$;

-- Update the app_settings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_settings') THEN
    -- Add a comment to ensure it's included in the generated types
    COMMENT ON TABLE app_settings IS 'Stores application configuration settings for the Campus Connect system';
  END IF;
END
$$;

-- Update the get_server_status function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'get_server_status'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Add a comment to ensure it's included in the generated types
    COMMENT ON FUNCTION get_server_status() IS 'Retrieves the most recent server status or returns default values if none exists';
  END IF;
END
$$; 