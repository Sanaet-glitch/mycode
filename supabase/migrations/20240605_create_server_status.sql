-- Create server_status table to store system metrics
CREATE TABLE IF NOT EXISTS server_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage NUMERIC NOT NULL,
  memory_usage NUMERIC NOT NULL,
  disk_usage NUMERIC NOT NULL,
  uptime_seconds BIGINT NOT NULL,
  is_database_connected BOOLEAN NOT NULL DEFAULT true,
  environment VARCHAR(50) NOT NULL,
  version VARCHAR(50) NOT NULL,
  node_version VARCHAR(50) NOT NULL,
  last_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for querying by date
CREATE INDEX IF NOT EXISTS idx_server_status_created_at ON server_status(created_at);

-- Enable RLS but only allow server-side access
ALTER TABLE server_status ENABLE ROW LEVEL SECURITY;

-- Only admins can view server status
CREATE POLICY "Admins can view server status" ON server_status 
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Only server functions can insert metrics
CREATE POLICY "Server functions can insert metrics" ON server_status 
  FOR INSERT WITH CHECK (
    -- This would normally be restricted to service role only
    -- Using admin check for demo purposes
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Add some initial data for demonstration
INSERT INTO server_status (
  cpu_usage, memory_usage, disk_usage, uptime_seconds,
  is_database_connected, environment, version, node_version,
  last_backup_at, created_at
) VALUES
  (23.5, 41.2, 57.8, 345600, true, 'production', '1.2.0', 'v18.16.0', now() - interval '12 hours', now()),
  (25.8, 42.7, 57.9, 345000, true, 'production', '1.2.0', 'v18.16.0', now() - interval '12 hours', now() - interval '6 hours'),
  (21.3, 40.5, 58.0, 344400, true, 'production', '1.2.0', 'v18.16.0', now() - interval '12 hours', now() - interval '1 hour');

-- Comment to explain the table
COMMENT ON TABLE server_status IS 'Stores system metrics for server monitoring and admin dashboard'; 