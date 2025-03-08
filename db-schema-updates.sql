-- Add additional fields to profiles table for enhanced user management
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lock_reason TEXT,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create audit logs table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policy for users to view their own logs
CREATE POLICY "Users can view their own logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for admins to insert logs
CREATE POLICY "Admins can insert logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policy for the system to insert logs
CREATE POLICY "System can insert logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL); 