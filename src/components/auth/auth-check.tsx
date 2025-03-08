import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordChange } from './password-change';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/services/userService';

interface AuthCheckProps {
  children: ReactNode;
  requiredRole?: string;
}

export function AuthCheck({ children, requiredRole }: AuthCheckProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          // No session, so we don't need to do anything
          setLoading(false);
          return;
        }
        
        // Set the user ID from the session
        setUserId(session.user.id);
        
        // Check if the user needs to change their password and get their role
        const { data, error } = await supabase
          .from('profiles')
          .select('force_password_change, role')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          setLoading(false);
          return;
        }
        
        setNeedsPasswordChange(!!data?.force_password_change);
        setUserRole(data?.role as UserRole);
        
        // Check authorization
        if (requiredRole && data?.role !== requiredRole) {
          setUnauthorized(true);
        }
      } catch (err) {
        console.error('Error checking auth state:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthState();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUserId(session.user.id);
          
          // Check if the user needs to change their password and get their role
          const { data, error } = await supabase
            .from('profiles')
            .select('force_password_change, role')
            .eq('id', session.user.id)
            .single();
          
          if (!error && data) {
            setNeedsPasswordChange(!!data.force_password_change);
            setUserRole(data?.role as UserRole);
            
            // Check authorization
            if (requiredRole && data?.role !== requiredRole) {
              setUnauthorized(true);
            } else {
              setUnauthorized(false);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setUserRole(null);
        setNeedsPasswordChange(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }
  
  // Handle unauthorized access
  if (unauthorized) {
    return (
      <Navigate 
        to="/" 
        state={{ from: location, error: "You don't have permission to access this page" }} 
        replace 
      />
    );
  }
  
  // If user needs to change password, show password change form
  if (needsPasswordChange && userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <PasswordChange 
          userId={userId} 
          onSuccess={() => setNeedsPasswordChange(false)} 
        />
      </div>
    );
  }
  
  // Otherwise, render children
  return <>{children}</>;
} 