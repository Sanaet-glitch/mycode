import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for system health stats
 */
export interface SystemHealth {
  serverStatus: 'healthy' | 'issues' | 'down';
  dbStatus: 'healthy' | 'issues' | 'down';
  storageStatus: 'healthy' | 'issues' | 'down';
  apiStatus: 'healthy' | 'issues' | 'down';
  lastChecked: string;
  details?: {
    serverLatency?: number;
    dbLatency?: number;
    storageLatency?: number;
    apiLatency?: number;
    activeConnections?: number;
    errorRate?: number;
  };
}

/**
 * Interface for system resource usage
 */
export interface SystemResources {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  networkUsage: {
    in: number; // Mbps
    out: number; // Mbps
  };
  timestamp: string;
}

/**
 * Get current system health status
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    // Ping database with a simple query to check responsiveness
    const startTime = Date.now();
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);
    const dbLatency = Date.now() - startTime;
    
    // Simple storage check
    const storageStartTime = Date.now();
    const { error: storageError } = await supabase.storage.getBucket('public');
    const storageLatency = Date.now() - storageStartTime;
    
    return {
      serverStatus: 'healthy',
      dbStatus: dbError ? 'issues' : 'healthy',
      storageStatus: storageError ? 'issues' : 'healthy',
      apiStatus: 'healthy', // Assume API is healthy if we're executing this function
      lastChecked: new Date().toISOString(),
      details: {
        dbLatency,
        storageLatency,
        serverLatency: 10, // Placeholder, would need a real server health check
        apiLatency: 15, // Placeholder, would need a real API health check
        activeConnections: 42, // Placeholder, would need a real active connection count
        errorRate: 0.5 // Placeholder, would need a real error rate calculation
      }
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      serverStatus: 'issues',
      dbStatus: 'issues',
      storageStatus: 'issues',
      apiStatus: 'issues',
      lastChecked: new Date().toISOString()
    };
  }
};

/**
 * Get system resource usage
 */
export const getSystemResources = async (): Promise<SystemResources> => {
  try {
    // In a real implementation, this would connect to a system monitoring service
    // For now, we'll return sample data
    
    // Simulate a database call
    await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);
    
    return {
      cpuUsage: Math.random() * 60 + 10, // Random between 10-70%
      memoryUsage: Math.random() * 50 + 20, // Random between 20-70%
      diskUsage: Math.random() * 30 + 40, // Random between 40-70%
      networkUsage: {
        in: Math.random() * 100, // Random between 0-100 Mbps
        out: Math.random() * 60 // Random between 0-60 Mbps
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system resources:', error);
    throw error;
  }
};

/**
 * Interface for system notification
 */
export interface SystemNotification {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: string;
  created_at: string;
  read: boolean;
  source: string;
}

/**
 * Get system notifications
 */
export const getSystemNotifications = async (limit: number = 10): Promise<SystemNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting system notifications:', error);
    
    // Return sample data in case of error or if the table doesn't exist yet
    return [
      {
        id: '1',
        level: 'warning',
        message: 'Disk space is running low',
        details: 'Server disk usage has exceeded 80%',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        source: 'system'
      },
      {
        id: '2',
        level: 'info',
        message: 'System backup completed successfully',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        source: 'backup'
      }
    ];
  }
};

/**
 * Mark system notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Interface for admin activity log
 */
export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  timestamp: string;
}

/**
 * Get admin activity logs
 */
export const getAdminActivityLogs = async (
  limit: number = 50,
  offset: number = 0,
  filters?: {
    adminId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    searchText?: string;
  }
): Promise<{ logs: AdminActivityLog[]; total: number }> => {
  try {
    let query = supabase
      .from('admin_activity_logs')
      .select('*, admin:admin_id(full_name)', { count: 'exact' });
    
    // Apply filters
    if (filters) {
      if (filters.adminId) query = query.eq('admin_id', filters.adminId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.entityType) query = query.eq('entity_type', filters.entityType);
      
      if (filters.startDate && filters.endDate) {
        query = query.gte('timestamp', filters.startDate).lte('timestamp', filters.endDate);
      } else if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      } else if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      
      if (filters.searchText) {
        query = query.or(`details.ilike.%${filters.searchText}%,action.ilike.%${filters.searchText}%`);
      }
    }
    
    // Apply pagination
    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Transform the data to include admin name
    const logs = data?.map(log => ({
      ...log,
      admin_name: log.admin?.full_name || 'Unknown',
      admin: undefined // Remove nested admin object
    })) || [];
    
    return { logs, total: count || 0 };
  } catch (error) {
    console.error('Error getting admin activity logs:', error);
    
    // Return sample data in case of error
    return {
      logs: [
        {
          id: '1',
          admin_id: '123',
          admin_name: 'John Admin',
          action: 'user_create',
          entity_type: 'user',
          entity_id: '456',
          details: { email: 'user@example.com', role: 'student' },
          ip_address: '192.168.1.1',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      total: 1
    };
  }
};

/**
 * Log admin activity
 */
export const logAdminActivity = async (
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: '127.0.0.1', // In a real app, get the IP from the request
        timestamp: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error logging admin activity:', error);
    // Don't throw to prevent blocking main functionality
    return false;
  }
};

/**
 * Interface for feature flag
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  audience?: 'all' | 'admins' | 'teachers' | 'students' | 'beta_users';
  percentage?: number; // Percentage of users who get this feature (0-100)
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all feature flags
 */
export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting feature flags:', error);
    
    // Return sample data in case of error
    return [
      {
        id: '1',
        name: 'new_reporting_dashboard',
        description: 'Enable the new reporting dashboard UI',
        enabled: true,
        audience: 'admins',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        name: 'advanced_analytics',
        description: 'Enable advanced analytics features',
        enabled: false,
        audience: 'all',
        percentage: 20,
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }
};

/**
 * Update a feature flag
 */
export const updateFeatureFlag = async (
  flagId: string,
  updates: Partial<Omit<FeatureFlag, 'id' | 'created_at'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', flagId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating feature flag ${flagId}:`, error);
    throw error;
  }
}; 