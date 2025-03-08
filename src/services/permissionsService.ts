import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for permission data
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Interface for role data
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Interface for role-permission mapping
 */
export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

/**
 * Gets all roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting roles:', error);
    throw error;
  }
};

/**
 * Gets a role by ID
 */
export const getRoleById = async (id: string): Promise<Role | null> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting role ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new role
 */
export const createRole = async (role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        ...role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

/**
 * Updates an existing role
 */
export const updateRole = async (id: string, role: Partial<Role>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('roles')
      .update({
        ...role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a role
 */
export const deleteRole = async (id: string): Promise<boolean> => {
  try {
    // First check if role is a system role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();
    
    if (roleError) throw roleError;
    
    // Don't allow deletion of system roles
    if (roleData.is_system) {
      throw new Error('System roles cannot be deleted');
    }
    
    // Delete associated role permissions first
    const { error: rolePermError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', id);
    
    if (rolePermError) throw rolePermError;
    
    // Delete the role
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};

/**
 * Gets all permissions
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting permissions:', error);
    throw error;
  }
};

/**
 * Gets a permission by ID
 */
export const getPermissionById = async (id: string): Promise<Permission | null> => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting permission ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new permission
 */
export const createPermission = async (
  permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        ...permission,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

/**
 * Updates an existing permission
 */
export const updatePermission = async (id: string, permission: Partial<Permission>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('permissions')
      .update({
        ...permission,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating permission ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a permission
 */
export const deletePermission = async (id: string): Promise<boolean> => {
  try {
    // Delete associated role permissions first
    const { error: rolePermError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('permission_id', id);
    
    if (rolePermError) throw rolePermError;
    
    // Delete the permission
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting permission ${id}:`, error);
    throw error;
  }
};

/**
 * Gets permissions for a role
 */
export const getPermissionsForRole = async (roleId: string): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions:permission_id(*)
      `)
      .eq('role_id', roleId);
    
    if (error) throw error;
    
    return data.map(item => item.permissions) || [];
  } catch (error) {
    console.error(`Error getting permissions for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Assigns permissions to a role
 */
export const assignPermissionsToRole = async (
  roleId: string, 
  permissionIds: string[]
): Promise<boolean> => {
  try {
    // Start a transaction
    const { error: transactionError } = await supabase.rpc('assign_permissions_to_role', {
      role_id: roleId,
      permission_ids: permissionIds
    });
    
    if (transactionError) throw transactionError;
    
    return true;
  } catch (error) {
    console.error(`Error assigning permissions to role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Updates permissions for a role (removing existing ones and adding new ones)
 */
export const updateRolePermissions = async (
  roleId: string, 
  permissionIds: string[]
): Promise<boolean> => {
  try {
    // First delete all existing permissions for the role
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);
    
    if (deleteError) throw deleteError;
    
    // If no permissions to add, return
    if (permissionIds.length === 0) {
      return true;
    }
    
    // Add the new permissions
    const rolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId
    }));
    
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);
    
    if (insertError) throw insertError;
    
    return true;
  } catch (error) {
    console.error(`Error updating permissions for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Gets user permissions (combined from all roles)
 */
export const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  try {
    // Get the user's profile to determine roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    // Get the role ID for the user's role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', profile.role)
      .single();
    
    if (roleError) throw roleError;
    
    // Get permissions for the role
    return await getPermissionsForRole(roleData.id);
  } catch (error) {
    console.error(`Error getting permissions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Checks if a user has a specific permission
 */
export const hasPermission = async (userId: string, resource: string, action: string): Promise<boolean> => {
  try {
    const permissions = await getUserPermissions(userId);
    
    return permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  } catch (error) {
    console.error(`Error checking permission for user ${userId}:`, error);
    throw error;
  }
}; 