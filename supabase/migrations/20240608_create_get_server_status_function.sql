-- Create a function to safely get server status
CREATE OR REPLACE FUNCTION get_server_status()
RETURNS SETOF server_status
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM server_status
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no rows returned, return a default row
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      gen_random_uuid() as id,
      25.0 as cpu_usage,
      40.0 as memory_usage,
      55.0 as disk_usage,
      259200 as uptime_seconds, -- 3 days
      true as is_database_connected,
      'development' as environment,
      '1.0.0' as version,
      'v16.14.0' as node_version,
      now() - interval '12 hours' as last_backup_at,
      now() as created_at;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_server_status() TO authenticated;

-- Comment to explain the function
COMMENT ON FUNCTION get_server_status IS 'Retrieves the most recent server status or returns default values if none exists'; 