import { supabase } from '@/integrations/supabase/client';
import { Profile, AuditLog, UserStats } from '@/types/database';

export type UserRole = 'admin' | 'student' | 'lecturer';

export interface UserData {
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  avatar_url?: string;
}

export interface UserUpdateData {
  fullName?: string;
  role?: UserRole;
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  avatar_url?: string;
  isActive?: boolean;
}

/**
 * Creates a new user with a temporary password
 * @param userData User data including email, fullName, and role
 * @returns The created user data or error
 */
export const createUser = async (userData: UserData) => {
  try {
    // Generate a random password (8 characters)
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'A1!';
    
    // Create a new user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: temporaryPassword,
      email_confirm: true,
    });
    
    if (authError) throw authError;
    
    if (!authUser.user) {
      throw new Error('User creation failed: No user data returned');
    }
    
    // Insert the user profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role,
        student_id: userData.studentId,
        department: userData.department,
        phone_number: userData.phoneNumber,
        avatar_url: userData.avatar_url,
        force_password_change: true,
        is_active: true
      });
    
    if (profileError) throw profileError;
    
    // Return success with the temporary password
    return { 
      success: true, 
      user: authUser.user,
      temporaryPassword, // This will be shown to the admin
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
};

/**
 * Gets all users (admin only)
 * @returns Array of user profiles
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Gets users by role
 * @param role The role to filter by
 * @returns Array of user profiles
 */
export const getUsersByRole = async (role: UserRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching ${role}s:`, error);
    throw error;
  }
  
  return data || [];
};

/**
 * Gets a single user by ID
 * @param userId The user ID to fetch
 * @returns The user profile or null
 */
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
  
  return data;
};

/**
 * Updates a user's profile
 * @param userId The user ID to update
 * @param userData The user data to update
 * @returns Success status
 */
export const updateUser = async (userId: string, userData: UserUpdateData) => {
  try {
    const updateData: any = {};
    
    if (userData.fullName) updateData.full_name = userData.fullName;
    if (userData.role) updateData.role = userData.role;
    if (userData.studentId !== undefined) updateData.student_id = userData.studentId;
    if (userData.department !== undefined) updateData.department = userData.department;
    if (userData.phoneNumber !== undefined) updateData.phone_number = userData.phoneNumber;
    if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url;
    if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
};

/**
 * Deletes a user
 * @param userId The user ID to delete
 * @returns Success status
 */
export const deleteUser = async (userId: string) => {
  try {
    // Delete from profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
};

/**
 * Resets a user's password
 * @param userId The user ID to reset password for
 * @returns The new temporary password
 */
export const resetUserPassword = async (userId: string) => {
  try {
    const newPassword = Math.random().toString(36).slice(-8) + 'A1!';
    
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    
    if (error) throw error;
    
    // Mark that the user needs to change their password
    await supabase
      .from('profiles')
      .update({ 
        force_password_change: true 
      } as any)
      .eq('id', userId);
    
    return { success: true, temporaryPassword: newPassword };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};

/**
 * Bulk create users from CSV/Excel data
 * @param users Array of user data
 * @returns Results of the bulk operation
 */
export const bulkCreateUsers = async (users: UserData[]) => {
  const results = {
    success: [] as any[],
    failed: [] as any[],
  };
  
  for (const userData of users) {
    try {
      const result = await createUser(userData);
      if (result.success) {
        results.success.push({
          email: userData.email,
          password: result.temporaryPassword,
        });
      } else {
        results.failed.push({
          email: userData.email,
          error: result.error,
        });
      }
    } catch (error) {
      results.failed.push({
        email: userData.email,
        error,
      });
    }
  }
  
  return results;
};

/**
 * Count users by role
 * @returns Object with counts by role
 */
export const countUsersByRole = async (): Promise<UserStats> => {
  try {
    // Cast the result since we know the table structure might not match the TypeScript types yet
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active');
    
    if (error) throw error;
    
    // Safely cast the data to access the properties we need
    const typedData = data as unknown as Array<{role: UserRole, is_active?: boolean}>;
    
    const result: UserStats = {
      totalUsers: typedData.length,
      activeUsers: typedData.filter(user => user.is_active !== false).length,
      inactiveUsers: typedData.filter(user => user.is_active === false).length,
      studentCount: typedData.filter(user => user.role === 'student').length,
      lecturerCount: typedData.filter(user => user.role === 'lecturer').length,
      adminCount: typedData.filter(user => user.role === 'admin').length,
    };
    
    return result;
  } catch (error) {
    console.error('Error counting users by role:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      studentCount: 0,
      lecturerCount: 0,
      adminCount: 0,
    };
  }
};

/**
 * Gets user activity logs
 * @param userId The user ID to fetch logs for
 * @returns Array of activity logs
 */
export const getUserActivityLogs = async (userId: string): Promise<AuditLog[]> => {
  try {
    // Use the actual audit_logs table now
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []) as AuditLog[];
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return [];
  }
};

/**
 * Gets all departments
 * @returns Array of departments
 */
export const getAllDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .not('department', 'is', null);
    
    if (error) throw error;
    
    // Extract unique departments
    const departments = [...new Set(data.map(item => (item as any).department))];
    return departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

/**
 * Log user action manually (for front-end initiated actions)
 * @param userId User ID
 * @param action Action performed
 * @param entityType Type of entity acted upon
 * @param entityId ID of entity
 * @param details Additional details
 */
export const logUserAction = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: any
) => {
  try {
    // Use the actual audit_logs table now
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: 'client-side', // Since we can't reliably get IP on client
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error logging user action:', error);
    return { success: false, error };
  }
}; 