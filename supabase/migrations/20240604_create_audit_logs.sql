-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index for faster queries
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create row level security policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Only admins can see all logs
CREATE POLICY "Admins can see all logs" ON audit_logs 
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Users can see their own logs
CREATE POLICY "Users can see their own logs" ON audit_logs 
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Only server-side functions or admins can insert logs
CREATE POLICY "Admins can insert logs" ON audit_logs 
  FOR INSERT WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Comment to explain the table
COMMENT ON TABLE audit_logs IS 'Stores user activity logs for auditing purposes'; 