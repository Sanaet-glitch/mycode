-- Create system_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);

-- Enable RLS but only allow access for admins
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can view configs
CREATE POLICY "Admins can view configs" ON system_configs 
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Only admins can modify configs
CREATE POLICY "Admins can modify configs" ON system_configs 
  FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Create backups table if it doesn't exist
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  includes_files BOOLEAN DEFAULT true,
  includes_database BOOLEAN DEFAULT true
);

-- Create backup_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS backup_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  auto_backup BOOLEAN DEFAULT true,
  schedule VARCHAR(20) DEFAULT 'weekly',
  time VARCHAR(5) DEFAULT '02:00',
  retention_period INTEGER DEFAULT 30,
  included_elements JSONB DEFAULT '{"database":true,"files":true,"settings":true,"logs":false}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initial data for system_configs
INSERT INTO system_configs (key, value, category, description) 
VALUES 
  ('app_name', '"Campus Connect"', 'general', 'Application name'),
  ('maintenance_mode', 'false', 'maintenance', 'Whether the application is in maintenance mode'),
  ('allow_registration', 'true', 'security', 'Whether user registration is enabled'),
  ('smtp_enabled', 'true', 'email', 'Whether SMTP email sending is enabled')
ON CONFLICT (key) DO NOTHING;

-- Initial data for backup_config
INSERT INTO backup_config (id, auto_backup, schedule, time, retention_period)
VALUES (1, true, 'weekly', '02:00', 30)
ON CONFLICT (id) DO NOTHING; 