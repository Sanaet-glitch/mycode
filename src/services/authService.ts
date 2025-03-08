import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for password policy
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  enforcePreviousPasswordCheck: boolean;
  previousPasswordCount: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
}

/**
 * Interface for auth event
 */
export interface AuthEvent {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Gets the current password policy
 */
export const getPasswordPolicy = async (): Promise<PasswordPolicy> => {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'password_policy')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Return default policy if not found
        return getDefaultPasswordPolicy();
      }
      throw error;
    }
    
    return data.value as PasswordPolicy;
  } catch (error) {
    console.error('Error getting password policy:', error);
    return getDefaultPasswordPolicy();
  }
};

/**
 * Gets the default password policy
 */
export const getDefaultPasswordPolicy = (): PasswordPolicy => {
  return {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiryDays: 90,
    enforcePreviousPasswordCheck: true,
    previousPasswordCount: 3,
    maxFailedAttempts: 5,
    lockoutDuration: 30 // in minutes
  };
};

/**
 * Updates the password policy
 */
export const updatePasswordPolicy = async (policy: PasswordPolicy): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_configs')
      .upsert({
        key: 'password_policy',
        value: policy,
        category: 'security',
        description: 'Password security policy',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating password policy:', error);
    throw error;
  }
};

/**
 * Resets a user's password
 */
export const resetUserPassword = async (userId: string): Promise<string> => {
  try {
    // Generate a temporary password that meets requirements
    const temporaryPassword = generateSecurePassword();
    
    // Use Supabase's admin API to update the password
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });
    
    if (error) throw error;
    
    // Update user profile to force password change on next login
    await supabase
      .from('profiles')
      .update({ 
        force_password_change: true,
        failed_login_attempts: 0,
        account_locked: false
      })
      .eq('id', userId);
    
    // Log the password reset
    await logAuthEvent(userId, 'password_reset', {
      admin_reset: true,
      reset_time: new Date().toISOString()
    });
    
    return temporaryPassword;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Performs a bulk password reset for multiple users
 */
export const bulkResetPasswords = async (userIds: string[]): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  for (const userId of userIds) {
    try {
      const temporaryPassword = await resetUserPassword(userId);
      results[userId] = temporaryPassword;
    } catch (error) {
      console.error(`Error resetting password for user ${userId}:`, error);
      results[userId] = 'Error resetting password';
    }
  }
  
  return results;
};

/**
 * Unlocks a user account
 */
export const unlockUserAccount = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        account_locked: false,
        failed_login_attempts: 0,
        lock_reason: null
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log the account unlock
    await logAuthEvent(userId, 'account_unlock', {
      unlock_time: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error(`Error unlocking account for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Changes a user's account status (activate/deactivate)
 */
export const changeAccountStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log the account status change
    await logAuthEvent(userId, isActive ? 'account_activated' : 'account_deactivated', {
      change_time: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error(`Error changing account status for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Gets authentication events for a user
 */
export const getUserAuthEvents = async (userId: string, limit: number = 20): Promise<AuthEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('auth_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting auth events for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Logs an authentication event
 */
export const logAuthEvent = async (
  userId: string, 
  type: string, 
  metadata?: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('auth_events')
      .insert({
        user_id: userId,
        type,
        created_at: new Date().toISOString(),
        metadata
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error logging auth event for user ${userId}:`, error);
    // Don't throw errors for logging failures to prevent blocking main functionality
    return false;
  }
};

/**
 * Gets password status information for a user
 */
export const getPasswordStatus = async (userId: string): Promise<any> => {
  try {
    // Get password policy
    const policy = await getPasswordPolicy();
    
    // Get user's last password change time
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('last_password_change')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Calculate days since last password change
    const lastChange = userData.last_password_change 
      ? new Date(userData.last_password_change) 
      : null;
    
    const today = new Date();
    const daysSinceChange = lastChange 
      ? Math.floor((today.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)) 
      : null;
    
    // Calculate password expiration status
    const isExpired = daysSinceChange !== null && daysSinceChange > policy.passwordExpiryDays;
    const daysUntilExpiry = daysSinceChange !== null 
      ? Math.max(0, policy.passwordExpiryDays - daysSinceChange) 
      : null;
    
    return {
      lastChanged: lastChange ? lastChange.toISOString() : null,
      daysSinceChange,
      daysUntilExpiry,
      isExpired,
      policy
    };
  } catch (error) {
    console.error(`Error getting password status for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Generates a secure random password that meets policy requirements
 */
export const generateSecurePassword = (): string => {
  const policy = getDefaultPasswordPolicy();
  const length = Math.max(policy.minLength, 10);
  
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let allChars = '';
  let password = '';
  
  // Add required character types
  if (policy.requireUppercase) {
    allChars += uppercaseChars;
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  }
  
  if (policy.requireLowercase) {
    allChars += lowercaseChars;
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  }
  
  if (policy.requireNumbers) {
    allChars += numberChars;
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  }
  
  if (policy.requireSpecialChars) {
    allChars += specialChars;
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  }
  
  // If allChars is empty (shouldn't happen with default policy), use lowercase
  if (allChars.length === 0) {
    allChars = lowercaseChars;
  }
  
  // Fill the rest of the password with random characters
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}; 