-- Create a function to safely get server status history
CREATE OR REPLACE FUNCTION get_server_status_history(days_back integer DEFAULT 7)
RETURNS SETOF server_status
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date timestamptz;
  mock_data server_status;
  i integer;
BEGIN
  start_date := now() - (days_back || ' days')::interval;
  
  -- First try to return actual data if it exists
  RETURN QUERY
  SELECT *
  FROM server_status
  WHERE created_at >= start_date
  ORDER BY created_at ASC;
  
  -- If no rows returned, generate mock data
  IF NOT FOUND THEN
    FOR i IN 0..days_back LOOP
      mock_data := ROW(
        gen_random_uuid(),
        25.0 + random() * 15.0,
        40.0 + random() * 20.0,
        55.0 + random() * 5.0,
        86400 * (days_back - i + 3),
        true,
        'development',
        '1.0.0',
        'v16.14.0',
        now() - ((i + 0.5) || ' days')::interval,
        now() - (i || ' days')::interval
      )::server_status;
      
      RETURN NEXT mock_data;
    END LOOP;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_server_status_history(integer) TO authenticated;

-- Comment to explain the function
COMMENT ON FUNCTION get_server_status_history IS 'Retrieves server status history for the specified number of days or returns mock data if none exists'; 