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

-- Create a function to log user creation events
CREATE OR REPLACE FUNCTION public.log_user_creation()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  details JSONB;
BEGIN
  -- Try to get the admin user ID from the current context
  admin_id := auth.uid();
  
  -- Create the details JSON
  details := jsonb_build_object(
    'email', NEW.email,
    'created_by', admin_id
  );
  
  -- Insert into audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    admin_id,
    'user_created',
    'user',
    NEW.id,
    details
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to log user creation
CREATE TRIGGER log_user_creation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.log_user_creation();

-- Create a function to log password changes
CREATE OR REPLACE FUNCTION public.log_password_change()
RETURNS TRIGGER AS $$
DECLARE
  details JSONB;
BEGIN
  -- Create the details JSON
  details := jsonb_build_object(
    'user_id', NEW.id,
    'changed_at', NOW()
  );
  
  -- Insert into audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    NEW.id,
    'password_changed',
    'user',
    NEW.id,
    details
  );
  
  -- Update the force_password_change flag if it's the user's first password change
  UPDATE public.profiles
  SET force_password_change = FALSE
  WHERE id = NEW.id AND force_password_change = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to log password changes
CREATE TRIGGER log_password_change
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.encrypted_password != NEW.encrypted_password)
EXECUTE FUNCTION public.log_password_change(); 