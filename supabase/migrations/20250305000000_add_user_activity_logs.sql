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

-- Create a function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  details JSONB;
BEGIN
  -- Try to get the admin user ID from the current context
  admin_id := auth.uid();
  
  -- Insert into audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(NEW.user_id, admin_id),
    NEW.action,
    NEW.entity_type,
    NEW.entity_id,
    NEW.details
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 