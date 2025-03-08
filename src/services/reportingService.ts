import { supabase } from '@/integrations/supabase/client';
import { UserStats } from '@/types/database';

/**
 * Interface for user statistics
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: Record<string, number>;
  usersByStatus: {
    active: number;
    inactive: number;
    locked: number;
    pendingActivation: number;
  };
}

/**
 * Interface for login record
 */
export interface LoginRecord {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: string;
  ip_address: string;
  device: string;
  browser: string;
  status: 'success' | 'failed';
  timestamp: string;
}

/**
 * Interface for activity summary by day
 */
export interface ActivityDay {
  date: string;
  total: number;
  logins: number;
  contentViews: number;
  submissions: number;
  comments: number;
  otherActions: number;
}

/**
 * Interface for course engagement metrics
 */
export interface CourseEngagement {
  course_id: string;
  course_name: string;
  total_students: number;
  active_students: number;
  completion_rate: number;
  avg_time_spent: number;
  total_materials: number;
  total_assignments: number;
  total_discussions: number;
  last_activity: string;
}

/**
 * Interface for attendance statistics
 */
export interface AttendanceStatistics {
  overall_rate: number;
  by_department: Record<string, number>;
  by_course: Record<string, number>;
  by_day_of_week: Record<string, number>;
  by_time_of_day: Record<string, number>;
  trends: {
    date: string;
    rate: number;
  }[];
}

/**
 * Get user statistics
 */
export const getUserStatistics = async (
  timeRange: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<UserStatistics> => {
  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const startDateStr = startDate.toISOString();
    
    // Get total users
    const { count: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get active users (users that have logged in during the time range)
    const { count: activeUsers, error: activeError } = await supabase
      .from('auth_events')
      .select('user_id', { count: 'exact', head: true })
      .eq('type', 'login')
      .gte('created_at', startDateStr)
      .distinct();
    
    if (activeError) throw activeError;
    
    // Get new users created during the time range
    const { count: newUsers, error: newError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);
    
    if (newError) throw newError;
    
    // Get users by role
    const { data: roleData, error: roleError } = await supabase
      .from('profiles')
      .select('role, count')
      .group('role');
    
    if (roleError) throw roleError;
    
    const usersByRole: Record<string, number> = {};
    roleData?.forEach(item => {
      usersByRole[item.role || 'unknown'] = item.count || 0;
    });
    
    // Get users by status
    const { data: statusData, error: statusError } = await supabase
      .from('profiles')
      .select('is_active, account_locked, count')
      .group('is_active, account_locked');
    
    if (statusError) throw statusError;
    
    let active = 0;
    let inactive = 0;
    let locked = 0;
    
    statusData?.forEach(item => {
      if (item.account_locked) {
        locked += item.count || 0;
      } else if (item.is_active) {
        active += item.count || 0;
      } else {
        inactive += item.count || 0;
      }
    });
    
    // Get pending activation (users that haven't logged in yet)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('last_sign_in_at', null);
    
    if (pendingError) throw pendingError;
    
    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      usersByRole,
      usersByStatus: {
        active,
        inactive,
        locked,
        pendingActivation: pendingCount || 0
      }
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    
    // Return sample data
    return {
      totalUsers: 250,
      activeUsers: 180,
      newUsers: 12,
      usersByRole: {
        admin: 5,
        teacher: 45,
        student: 200
      },
      usersByStatus: {
        active: 230,
        inactive: 15,
        locked: 5,
        pendingActivation: 0
      }
    };
  }
};

/**
 * Get recent login records
 */
export const getRecentLogins = async (
  limit: number = 10,
  includeFailures: boolean = true
): Promise<LoginRecord[]> => {
  try {
    let query = supabase
      .from('auth_events')
      .select(`
        id,
        user_id,
        created_at as timestamp,
        ip_address,
        metadata,
        user_agent,
        profiles!auth_events_user_id_fkey (
          email:user_email,
          full_name,
          role
        )
      `)
      .eq('type', 'login');
    
    if (!includeFailures) {
      query = query.not('metadata', 'is', null);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Transform the data to match the LoginRecord interface
    return data?.map(item => {
      // Extract browser and device from user agent
      const userAgent = item.user_agent || '';
      const browser = extractBrowserInfo(userAgent);
      const device = extractDeviceInfo(userAgent);
      
      // Determine if login was successful
      const status = (item.metadata && !item.metadata.error) ? 'success' : 'failed';
      
      return {
        id: item.id,
        user_id: item.user_id,
        user_email: item.profiles?.email || 'unknown',
        user_name: item.profiles?.full_name || 'Unknown User',
        role: item.profiles?.role || 'unknown',
        ip_address: item.ip_address || 'unknown',
        device,
        browser,
        status,
        timestamp: item.timestamp
      };
    }) || [];
  } catch (error) {
    console.error('Error getting recent logins:', error);
    
    // Return empty array
    return [];
  }
};

/**
 * Get user activity summary by day
 */
export const getActivitySummary = async (
  days: number = 30
): Promise<ActivityDay[]> => {
  try {
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get activity counts by day from audit_logs
    const { data, error } = await supabase.rpc('get_daily_activity_summary', {
      start_date: startDateStr,
      days_count: days
    });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
    
    // If no data or RPC doesn't exist, generate sample data
    return generateSampleActivityData(days);
  } catch (error) {
    console.error('Error getting activity summary:', error);
    
    // Return sample data
    return generateSampleActivityData(days);
  }
};

/**
 * Get course engagement metrics
 */
export const getCourseEngagementMetrics = async (
  limit: number = 10,
  sortBy: 'activity' | 'students' | 'completion' = 'activity'
): Promise<CourseEngagement[]> => {
  try {
    // You would implement the actual Supabase query here
    // For now, return sample data
    const sampleData: CourseEngagement[] = [
      {
        course_id: 'c001',
        course_name: 'Introduction to Computer Science',
        total_students: 120,
        active_students: 98,
        completion_rate: 0.72,
        avg_time_spent: 45.3,
        total_materials: 24,
        total_assignments: 8,
        total_discussions: 5,
        last_activity: new Date(Date.now() - 3600000).toISOString()
      },
      {
        course_id: 'c002',
        course_name: 'Calculus I',
        total_students: 85,
        active_students: 70,
        completion_rate: 0.65,
        avg_time_spent: 38.7,
        total_materials: 32,
        total_assignments: 12,
        total_discussions: 3,
        last_activity: new Date(Date.now() - 7200000).toISOString()
      },
      {
        course_id: 'c003',
        course_name: 'English Composition',
        total_students: 150,
        active_students: 142,
        completion_rate: 0.88,
        avg_time_spent: 52.1,
        total_materials: 18,
        total_assignments: 15,
        total_discussions: 12,
        last_activity: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    
    // Sort the data based on the sortBy parameter
    let sortedData = [...sampleData];
    switch (sortBy) {
      case 'activity':
        sortedData.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
        break;
      case 'students':
        sortedData.sort((a, b) => b.total_students - a.total_students);
        break;
      case 'completion':
        sortedData.sort((a, b) => b.completion_rate - a.completion_rate);
        break;
    }
    
    return sortedData.slice(0, limit);
  } catch (error) {
    console.error('Error getting course engagement metrics:', error);
    return [];
  }
};

/**
 * Get attendance statistics
 */
export const getAttendanceStatistics = async (
  timeRange: 'week' | 'month' | 'semester' = 'month'
): Promise<AttendanceStatistics> => {
  try {
    // You would implement the actual Supabase query here
    // For now, return sample data
    const byDayOfWeek: Record<string, number> = {
      'Monday': 0.92,
      'Tuesday': 0.88,
      'Wednesday': 0.85,
      'Thursday': 0.90,
      'Friday': 0.78
    };
    
    const byTimeOfDay: Record<string, number> = {
      'Morning (8-11)': 0.91,
      'Midday (11-14)': 0.88,
      'Afternoon (14-17)': 0.83,
      'Evening (17-20)': 0.79
    };
    
    // Generate trend data
    const trends = [];
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 120;
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate random attendance rate with an overall trend and some daily fluctuation
      const baseRate = 0.85;
      const trendFactor = i / days * 0.1; // Slight upward trend
      const fluctuation = (Math.random() - 0.5) * 0.1; // Random fluctuation
      
      trends.push({
        date: date.toISOString().split('T')[0],
        rate: Math.min(1, Math.max(0, baseRate + trendFactor + fluctuation))
      });
    }
    
    return {
      overall_rate: 0.87,
      by_department: {
        'Computer Science': 0.92,
        'Mathematics': 0.89,
        'English': 0.85,
        'History': 0.82,
        'Physics': 0.88
      },
      by_course: {
        'Introduction to Programming': 0.94,
        'Calculus I': 0.91,
        'English Composition': 0.88,
        'World History': 0.83,
        'Physics 101': 0.89
      },
      by_day_of_week: byDayOfWeek,
      by_time_of_day: byTimeOfDay,
      trends
    };
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    return {
      overall_rate: 0,
      by_department: {},
      by_course: {},
      by_day_of_week: {},
      by_time_of_day: {},
      trends: []
    };
  }
};

/**
 * Generate a report based on criteria
 */
export const generateReport = async (
  reportType: string,
  dateRange: { startDate: string; endDate: string },
  filters: Record<string, any> = {},
  format: 'excel' | 'csv' | 'json' | 'pdf' = 'excel'
): Promise<any> => {
  try {
    // Implement database queries based on report type
    let reportData: any[] = [];
    
    switch (reportType) {
      case 'user_activity':
        reportData = await getUserActivityReport(dateRange, filters);
        break;
      case 'course_engagement':
        reportData = await getCourseEngagementReport(dateRange, filters);
        break;
      case 'attendance':
        reportData = await getAttendanceReport(dateRange, filters);
        break;
      case 'user_logins':
        reportData = await getUserLoginsReport(dateRange, filters);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
    
    // Return the report data and metadata
    return {
      type: reportType,
      dateRange,
      filters,
      format,
      generatedAt: new Date().toISOString(),
      data: reportData
    };
  } catch (error) {
    console.error(`Error generating ${reportType} report:`, error);
    throw error;
  }
};

/**
 * Helper function to generate user activity report
 */
const getUserActivityReport = async (
  dateRange: { startDate: string; endDate: string },
  filters: Record<string, any>
): Promise<any[]> => {
  // Implement the actual database query here
  // For now, return sample data
  return [
    {
      user_id: 'u1',
      user_name: 'John Doe',
      role: 'student',
      total_actions: 45,
      logins: 12,
      content_views: 18,
      submissions: 8,
      comments: 5,
      other: 2,
      last_action: new Date(Date.now() - 3600000).toISOString()
    },
    {
      user_id: 'u2',
      user_name: 'Jane Smith',
      role: 'student',
      total_actions: 62,
      logins: 15,
      content_views: 25,
      submissions: 12,
      comments: 8,
      other: 2,
      last_action: new Date(Date.now() - 7200000).toISOString()
    }
  ];
};

/**
 * Helper function to generate course engagement report
 */
const getCourseEngagementReport = async (
  dateRange: { startDate: string; endDate: string },
  filters: Record<string, any>
): Promise<any[]> => {
  // Implement the actual database query here
  // For now, return sample data
  return [
    {
      course_id: 'c1',
      course_name: 'Introduction to Computer Science',
      instructor: 'Professor Johnson',
      department: 'Computer Science',
      enrolled_students: 120,
      active_students: 98,
      completion_rate: 0.72,
      avg_time_spent: 45.3,
      total_materials: 24,
      total_assignments: 8,
      total_discussions: 5
    },
    {
      course_id: 'c2',
      course_name: 'Calculus I',
      instructor: 'Professor Williams',
      department: 'Mathematics',
      enrolled_students: 85,
      active_students: 70,
      completion_rate: 0.65,
      avg_time_spent: 38.7,
      total_materials: 32,
      total_assignments: 12,
      total_discussions: 3
    }
  ];
};

/**
 * Helper function to generate attendance report
 */
const getAttendanceReport = async (
  dateRange: { startDate: string; endDate: string },
  filters: Record<string, any>
): Promise<any[]> => {
  // Implement the actual database query here
  // For now, return sample data
  return [
    {
      date: '2023-10-01',
      course_id: 'c1',
      course_name: 'Introduction to Computer Science',
      class_time: '10:00 AM',
      total_students: 120,
      present: 110,
      absent: 5,
      excused: 5,
      attendance_rate: 0.92
    },
    {
      date: '2023-10-01',
      course_id: 'c2',
      course_name: 'Calculus I',
      class_time: '2:00 PM',
      total_students: 85,
      present: 75,
      absent: 7,
      excused: 3,
      attendance_rate: 0.88
    }
  ];
};

/**
 * Helper function to generate user logins report
 */
const getUserLoginsReport = async (
  dateRange: { startDate: string; endDate: string },
  filters: Record<string, any>
): Promise<any[]> => {
  try {
    const { startDate, endDate } = dateRange;
    
    let query = supabase
      .from('auth_events')
      .select(`
        id,
        user_id,
        created_at as timestamp,
        ip_address,
        user_agent,
        profiles!auth_events_user_id_fkey (
          email:user_email,
          full_name,
          role,
          department
        )
      `)
      .eq('type', 'login')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Apply filters
    if (filters.role) {
      query = query.eq('profiles.role', filters.role);
    }
    
    if (filters.department) {
      query = query.eq('profiles.department', filters.department);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data
    return data?.map(item => {
      // Extract browser and device from user agent
      const userAgent = item.user_agent || '';
      const browser = extractBrowserInfo(userAgent);
      const device = extractDeviceInfo(userAgent);
      
      return {
        login_id: item.id,
        user_id: item.user_id,
        user_email: item.profiles?.email || 'unknown',
        user_name: item.profiles?.full_name || 'Unknown User',
        role: item.profiles?.role || 'unknown',
        department: item.profiles?.department || 'unknown',
        ip_address: item.ip_address || 'unknown',
        device,
        browser,
        timestamp: item.timestamp
      };
    }) || [];
  } catch (error) {
    console.error('Error generating user logins report:', error);
    return [];
  }
};

/**
 * Helper function to generate sample activity data
 */
const generateSampleActivityData = (days: number): ActivityDay[] => {
  const result: ActivityDay[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate random data with a pattern
    // Weekends have less activity
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const baseFactor = isWeekend ? 0.3 : 1.0;
    
    // More recent days have slightly more activity
    const recencyFactor = 0.8 + (0.2 * (days - i) / days);
    
    const logins = Math.floor(Math.random() * 50 * baseFactor * recencyFactor) + 10;
    const contentViews = Math.floor(Math.random() * 120 * baseFactor * recencyFactor) + 20;
    const submissions = Math.floor(Math.random() * 30 * baseFactor * recencyFactor) + 5;
    const comments = Math.floor(Math.random() * 25 * baseFactor * recencyFactor) + 3;
    const otherActions = Math.floor(Math.random() * 15 * baseFactor * recencyFactor) + 2;
    
    result.push({
      date: dateStr,
      logins,
      contentViews,
      submissions,
      comments,
      otherActions,
      total: logins + contentViews + submissions + comments + otherActions
    });
  }
  
  return result;
};

/**
 * Helper function to extract browser information from user agent
 */
const extractBrowserInfo = (userAgent: string): string => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
  
  return 'Other';
};

/**
 * Helper function to extract device information from user agent
 */
const extractDeviceInfo = (userAgent: string): string => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android') && userAgent.includes('Mobile')) return 'Android Phone';
  if (userAgent.includes('Android')) return 'Android Tablet';
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac') && !userAgent.includes('iPhone') && !userAgent.includes('iPad')) return 'Mac';
  if (userAgent.includes('Linux') && !userAgent.includes('Android')) return 'Linux';
  
  return 'Other';
}; 