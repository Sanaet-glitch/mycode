-- Create app_settings table to store application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name VARCHAR(100) NOT NULL DEFAULT 'Campus Connect',
  site_description TEXT DEFAULT 'A comprehensive campus management system',
  contact_email VARCHAR(255) DEFAULT 'contact@campusconnect.com',
  support_email VARCHAR(255) DEFAULT 'support@campusconnect.com',
  logo_url VARCHAR(255) DEFAULT '/images/logo.png',
  favicon_url VARCHAR(255) DEFAULT '/favicon.ico',
  primary_color VARCHAR(20) DEFAULT '#3b82f6',
  allow_registration BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT true,
  max_login_attempts INTEGER DEFAULT 5,
  default_user_role VARCHAR(20) DEFAULT 'student',
  allowed_file_types VARCHAR(255) DEFAULT 'pdf,doc,docx,jpg,jpeg,png',
  max_file_size INTEGER DEFAULT 10,
  maintenance_mode BOOLEAN DEFAULT false,
  time_zone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  time_format VARCHAR(10) DEFAULT '12h',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS but only allow server-side access
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view app settings
CREATE POLICY "Admins can view app settings" ON app_settings 
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Only admins can update app settings
CREATE POLICY "Admins can update app settings" ON app_settings 
  FOR UPDATE USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Insert default settings
INSERT INTO app_settings (
  site_name, site_description, contact_email, support_email,
  logo_url, favicon_url, primary_color, allow_registration,
  require_email_verification, max_login_attempts, default_user_role,
  allowed_file_types, max_file_size, maintenance_mode,
  time_zone, date_format, time_format
) VALUES (
  'Campus Connect', 'A comprehensive campus management system',
  'contact@campusconnect.com', 'support@campusconnect.com',
  '/images/logo.png', '/favicon.ico', '#3b82f6', true,
  true, 5, 'student', 'pdf,doc,docx,jpg,jpeg,png',
  10, false, 'UTC', 'MM/DD/YYYY', '12h'
);

-- Comment to explain the table
COMMENT ON TABLE app_settings IS 'Stores application configuration settings for the Campus Connect system'; 