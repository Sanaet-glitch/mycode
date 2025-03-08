import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, AuthError } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/hooks/use-toast';

// Define types for user roles
export type UserRole = 'student' | 'lecturer' | 'admin' | null;

// Define user interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileCompleted: boolean;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error?: Error }>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: Error }>;
  setUserRole: (role: UserRole) => Promise<{ error?: Error }>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'student@example.com',
    password: 'password',
    name: 'Student User',
    role: 'student' as UserRole,
    profileCompleted: true,
  },
  {
    id: '2',
    email: 'lecturer@example.com',
    password: 'password',
    name: 'Lecturer User',
    role: 'lecturer' as UserRole,
    profileCompleted: true,
  },
  {
    id: '3',
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin User',
    role: 'admin' as UserRole,
    profileCompleted: true,
  },
];

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check Supabase for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          // Get user profile from Supabase
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (!profileError && profileData) {
            const user: User = {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email || '',
              name: profileData.full_name || '',
              role: profileData.role as UserRole,
              profileCompleted: true,
            };
            
            setUser(user);
            return;
          }
        }
        
        // Fallback to localStorage for existing auth
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore authentication', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First try to authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (data?.user) {
        // Get user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return { error: new Error('Error fetching user profile') };
        }
        
        // Create user object
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: profileData.full_name || '',
          role: profileData.role as UserRole,
          profileCompleted: true,
        };
        
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return {};
      }
      
      // If Supabase auth fails, try mock users as fallback (for development)
      if (error || !data.user) {
        // Find user with matching credentials in mock data
        const foundUser = MOCK_USERS.find(
          u => u.email === email && u.password === password
        );
        
        if (!foundUser) {
          return { error: new Error('Invalid email or password') };
        }
        
        // Create user object without password
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        
        return {};
      }
      
      return { error: new Error('Invalid email or password') };
    } catch (error) {
      console.error('Login failed', error);
      return { error: error instanceof Error ? error : new Error('Login failed') };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear user state and localStorage
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Try to register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Registration error:', error);
        return { error };
      }
      
      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: name,
            role: null,
            is_active: true,
            force_password_change: false,
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          return { error: new Error('Error creating user profile') };
        }
        
        // Create user object
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          name,
          role: null,
          profileCompleted: false,
        };
        
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        return {};
      }
      
      return { error: new Error('Registration failed') };
    } catch (error) {
      console.error('Registration failed', error);
      return { error: error instanceof Error ? error : new Error('Registration failed') };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate API call with 1s delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const userExists = MOCK_USERS.some(u => u.email === email);
      if (!userExists) {
        // For security reasons, we don't want to reveal if the email exists or not
        // So we'll just return success even if the email doesn't exist
        return {};
      }
      
      // In a real app, you would send a password reset email here
      
      return {};
    } catch (error) {
      console.error('Password reset failed', error);
      return { error: error instanceof Error ? error : new Error('Password reset failed') };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Simulate API call with 500ms delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!user) {
        return { error: new Error('User not authenticated') };
      }
      
      // Update user data
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Show success toast
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      return {};
    } catch (error) {
      console.error('Profile update failed', error);
      return { error: error instanceof Error ? error : new Error('Profile update failed') };
    } finally {
      setIsLoading(false);
    }
  };

  // Set user role
  const setUserRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      // Simulate API call with 500ms delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!user) {
        return { error: new Error('User not authenticated') };
      }
      
      // Update user role
      const updatedUser = { ...user, role, profileCompleted: true };
      setUser(updatedUser);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return {};
    } catch (error) {
      console.error('Setting user role failed', error);
      return { error: error instanceof Error ? error : new Error('Setting user role failed') };
    } finally {
      setIsLoading(false);
    }
  };

  // Create value object for context provider
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    resetPassword,
    updateProfile,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 