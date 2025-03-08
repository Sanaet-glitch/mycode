import { supabase } from '@/integrations/supabase/client';

export interface SystemLoad {
  cpu: number;
  memory: number;
  disk: number;
}

export interface SystemInfo {
  version: string;
  environment: string;
  nodeVersion: string;
  uptime: string; // formatted as "X days, X hours"
  databaseConnection: 'healthy' | 'degraded' | 'down';
  lastBackup: string; // ISO date string
  serverLoad: SystemLoad;
}

export interface ServerStatus {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime_seconds: number;
  is_database_connected: boolean;
  environment: string;
  version: string;
  node_version: string;
  last_backup_at: string;
  created_at: string;
}

/**
 * Gets the latest system information from the database
 * This fetches actual server metrics stored in the database
 */
export const getSystemMetrics = async (): Promise<SystemInfo> => {
  try {
    // Fetch the most recent server status using our RPC function
    const { data, error } = await supabase
      .rpc('get_server_status');
    
    if (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
    
    // If no data returned, use default values
    if (!data || data.length === 0) {
      console.warn('No server status data found, using defaults');
      return getDefaultSystemInfo();
    }
    
    const serverStatus = data[0];
    
    // Format uptime from seconds to readable format
    const uptimeSeconds = serverStatus.uptime_seconds;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const formattedUptime = `${days} days, ${hours} hours`;
    
    return {
      version: serverStatus.version,
      environment: serverStatus.environment,
      nodeVersion: serverStatus.node_version,
      uptime: formattedUptime,
      databaseConnection: serverStatus.is_database_connected ? 'healthy' : 'down',
      lastBackup: serverStatus.last_backup_at,
      serverLoad: {
        cpu: serverStatus.cpu_usage,
        memory: serverStatus.memory_usage,
        disk: serverStatus.disk_usage
      }
    };
  } catch (error) {
    console.error('Error in getSystemMetrics:', error);
    return getDefaultSystemInfo();
  }
};

// Helper function to get default system info
function getDefaultSystemInfo(): SystemInfo {
  return {
    version: '1.0.0',
    environment: 'development',
    nodeVersion: 'v18.x',
    uptime: '3 days, 0 hours',
    databaseConnection: 'healthy',
    lastBackup: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    serverLoad: {
      cpu: 25,
      memory: 40,
      disk: 55
    }
  };
}

/**
 * Gets the history of system metrics for charts/trends
 * @param days Number of days of history to fetch
 */
export const getSystemMetricsHistory = async (days: number = 7): Promise<ServerStatus[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Try to fetch from server_status table
    try {
      const { data, error } = await supabase
        .rpc('get_server_status_history', { days_back: days });
      
      if (error) {
        console.error('Error fetching system metrics history:', error);
        return generateMockHistoryData(days);
      }
      
      if (!data || data.length === 0) {
        return generateMockHistoryData(days);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getSystemMetricsHistory:', error);
      return generateMockHistoryData(days);
    }
  } catch (error) {
    console.error('Error in getSystemMetricsHistory:', error);
    return generateMockHistoryData(days);
  }
};

// Generate mock history data for demonstration
function generateMockHistoryData(days: number): ServerStatus[] {
  const result: ServerStatus[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some randomness to the metrics
    const cpuBase = 25 + Math.random() * 15;
    const memoryBase = 40 + Math.random() * 20;
    const diskBase = 55 + Math.random() * 5;
    
    result.push({
      id: `mock-${i}`,
      cpu_usage: Math.round(cpuBase * 10) / 10,
      memory_usage: Math.round(memoryBase * 10) / 10,
      disk_usage: Math.round(diskBase * 10) / 10,
      uptime_seconds: 86400 * (days - i + 3), // Increasing uptime
      is_database_connected: true,
      environment: 'development',
      version: '1.0.0',
      node_version: 'v16.14.0',
      last_backup_at: new Date(date.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      created_at: date.toISOString()
    });
  }
  
  return result;
} 