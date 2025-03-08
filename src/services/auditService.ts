import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for audit log
 */
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Interface for audit log with user information
 */
export interface AuditLogWithUser extends AuditLog {
  user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

/**
 * Log an audit event
 */
export const logAuditEvent = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw errors for logging failures to prevent blocking main functionality
    return false;
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (
  params: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    searchText?: string;
  } = {}
): Promise<{ logs: AuditLogWithUser[]; total: number }> => {
  try {
    const {
      limit = 50,
      offset = 0,
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      searchText
    } = params;
    
    let query = supabase
      .from('audit_logs')
      .select('*, user:user_id(full_name, email, role)', { count: 'exact' });
    
    // Apply filters
    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (resourceId) query = query.eq('resource_id', resourceId);
    
    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (startDate) {
      query = query.gte('created_at', startDate);
    } else if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    if (searchText) {
      // Search in details and action fields
      query = query.or(`action.ilike.%${searchText}%,details.ilike.%${searchText}%`);
    }
    
    // Apply pagination and sort
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    return {
      logs: data as AuditLogWithUser[] || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return { logs: [], total: 0 };
  }
};

/**
 * Get unique action types from audit logs
 */
export const getAuditActionTypes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action')
      .order('action')
      .distinct();
    
    if (error) throw error;
    
    return data?.map(item => item.action) || [];
  } catch (error) {
    console.error('Error getting audit action types:', error);
    return ['login', 'logout', 'create', 'update', 'delete', 'view', 'export'];
  }
};

/**
 * Get unique resource types from audit logs
 */
export const getAuditResourceTypes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('resource_type')
      .order('resource_type')
      .distinct();
    
    if (error) throw error;
    
    return data?.map(item => item.resource_type) || [];
  } catch (error) {
    console.error('Error getting audit resource types:', error);
    return ['user', 'course', 'class', 'attendance', 'report', 'setting'];
  }
};

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogs = async (
  userId: string,
  limit: number = 20
): Promise<AuditLog[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error getting audit logs for user ${userId}:`, error);
    return [];
  }
};

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditLogs = async (
  resourceType: string,
  resourceId: string,
  limit: number = 20
): Promise<AuditLogWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:user_id(full_name, email, role)')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data as AuditLogWithUser[] || [];
  } catch (error) {
    console.error(`Error getting audit logs for ${resourceType} ${resourceId}:`, error);
    return [];
  }
};

/**
 * Export audit logs to JSON format
 */
export const exportAuditLogsToJSON = async (
  params: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<string> => {
  try {
    // Get all logs matching the criteria (no pagination)
    const { logs } = await getAuditLogs({
      ...params,
      limit: 1000, // Limit to 1000 records for export
    });
    
    // Return the logs as a JSON string
    return JSON.stringify(logs, null, 2);
  } catch (error) {
    console.error('Error exporting audit logs to JSON:', error);
    throw error;
  }
};

/**
 * Generate a summary of recent audit activity
 */
export const generateAuditSummary = async (
  days: number = 7
): Promise<{
  totalEvents: number;
  userCount: number;
  actionBreakdown: Record<string, number>;
  resourceTypeBreakdown: Record<string, number>;
  topUsers: { user_id: string; full_name: string; count: number }[];
}> => {
  try {
    // Calculate the date X days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    // Get logs from the date range
    const { logs } = await getAuditLogs({
      startDate: startDateStr,
      limit: 10000, // Higher limit for summary
    });
    
    // Calculate summaries
    const actionCounts: Record<string, number> = {};
    const resourceTypeCounts: Record<string, number> = {};
    const userCounts: Record<string, { count: number; name: string }> = {};
    
    logs.forEach(log => {
      // Count actions
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Count resource types
      resourceTypeCounts[log.resource_type] = (resourceTypeCounts[log.resource_type] || 0) + 1;
      
      // Count users
      if (!userCounts[log.user_id]) {
        userCounts[log.user_id] = {
          count: 0,
          name: log.user?.full_name || 'Unknown User'
        };
      }
      userCounts[log.user_id].count++;
    });
    
    // Convert user counts to sorted array
    const topUsers = Object.entries(userCounts)
      .map(([user_id, { count, name }]) => ({ user_id, full_name: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 users
    
    return {
      totalEvents: logs.length,
      userCount: Object.keys(userCounts).length,
      actionBreakdown: actionCounts,
      resourceTypeBreakdown: resourceTypeCounts,
      topUsers
    };
  } catch (error) {
    console.error('Error generating audit summary:', error);
    return {
      totalEvents: 0,
      userCount: 0,
      actionBreakdown: {},
      resourceTypeBreakdown: {},
      topUsers: []
    };
  }
}; 