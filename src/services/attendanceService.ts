import { supabase, handleSupabaseError } from './supabaseClient';
import { toast } from '@/components/ui/use-toast';

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  class_session_id: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by?: string;
  distance?: number;
  verification_method?: 'qr' | 'location' | 'manual';
  device_info?: any;
  comments?: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  proximity_radius?: number;
  attendance_code?: string;
  created_by: string;
}

/**
 * Get active class sessions for a lecturer
 */
export const getActiveClassSessions = async (lecturerId: string) => {
  try {
    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        *,
        class:classes (
          id,
          name,
          course:courses (
            id,
            title,
            lecturer_id
          )
        )
      `)
      .eq('is_active', true)
      .filter('class.course.lecturer_id', 'eq', lecturerId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get active sessions for enrolled courses (student)
 */
export const getActiveSessionsForStudent = async (studentId: string) => {
  try {
    // First, get enrolled courses
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    if (enrollmentError) throw enrollmentError;
    
    if (!enrollments?.length) {
      return { data: [], error: null };
    }
    
    const courseIds = enrollments.map(e => e.course_id);
    
    // Then, get active sessions for these courses
    const { data: sessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .select(`
        *,
        class:classes (
          id,
          name,
          room,
          course:courses (
            id,
            title,
            code
          )
        )
      `)
      .eq('is_active', true)
      .filter('class.course.id', 'in', `(${courseIds.join(',')})`);
      
    if (sessionsError) throw sessionsError;
    
    return { data: sessions, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Start a new class session
 */
export const startClassSession = async (
  classId: string, 
  lecturerId: string, 
  location?: { latitude: number; longitude: number },
  proximityRadius?: number
) => {
  try {
    // Generate a random 6-digit attendance code
    const attendanceCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { data, error } = await supabase
      .from('class_sessions')
      .insert([{
        class_id: classId,
        is_active: true,
        started_at: new Date().toISOString(),
        location: location,
        proximity_radius: proximityRadius || 50, // Default 50 meters
        attendance_code: attendanceCode,
        created_by: lecturerId
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Class Session Started",
      description: "Students can now mark their attendance",
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to start class session",
      description: (error as Error).message,
      variant: "destructive"
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * End a class session
 */
export const endClassSession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('class_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Class Session Ended",
      description: "The attendance period is now closed",
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to end class session",
      description: (error as Error).message,
      variant: "destructive"
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Mark attendance for a student
 */
export const markAttendance = async (record: Omit<AttendanceRecord, 'timestamp'>) => {
  try {
    // Check if student has already been marked for this session
    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', record.student_id)
      .eq('class_session_id', record.class_session_id)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // If already marked, update it
    if (existing) {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          ...record,
          timestamp: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
        
      if (error) throw error;
      
      return { data, error: null, isUpdate: true };
    }
    
    // Otherwise insert new record
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        ...record,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null, isUpdate: false };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error), isUpdate: false };
  }
};

/**
 * Verify attendance by QR code
 */
export const verifyAttendanceByQR = async (
  qrData: string, 
  studentId: string,
  location?: { latitude: number; longitude: number }
) => {
  try {
    // Parse QR data to get session ID and code
    const { sessionId, code } = JSON.parse(qrData);
    
    // Verify the session is active and code matches
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .eq('attendance_code', code)
      .single();
      
    if (sessionError) throw new Error('Invalid or expired QR code');
    
    if (!session) {
      throw new Error('Session not found or no longer active');
    }
    
    // Check proximity if location is provided and session has location
    let distance = null;
    if (location && session.location) {
      distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.location.latitude,
        session.location.longitude
      );
      
      // If distance exceeds proximity radius, mark as 'present' but record the distance
      if (distance > (session.proximity_radius || 100)) {
        console.warn(`Student is ${distance.toFixed(2)}m away, exceeding the ${session.proximity_radius}m radius`);
      }
    }
    
    // Mark attendance
    const attendanceResult = await markAttendance({
      student_id: studentId,
      class_session_id: sessionId,
      status: 'present',
      verification_method: 'qr',
      distance: distance,
      device_info: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      ...attendanceResult,
      session
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error), session: null };
  }
};

/**
 * Get attendance statistics for a student
 */
export const getStudentAttendanceStats = async (studentId: string) => {
  try {
    // Get all attendance records for the student
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        class_session:class_sessions (
          started_at,
          class:classes (
            name,
            course:courses (
              title,
              code
            )
          )
        )
      `)
      .eq('student_id', studentId);
      
    if (error) throw error;
    
    // Calculate statistics
    const totalRecords = data.length;
    const presentCount = data.filter(r => r.status === 'present').length;
    const absentCount = data.filter(r => r.status === 'absent').length;
    const lateCount = data.filter(r => r.status === 'late').length;
    const excusedCount = data.filter(r => r.status === 'excused').length;
    
    const attendancePercentage = totalRecords > 0 
      ? Math.round((presentCount / totalRecords) * 100) 
      : 0;
    
    return {
      data: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage,
        records: data
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get monthly attendance data for charts
 */
export const getMonthlyAttendanceData = async (userId: string, role = 'student', months = 6) => {
  try {
    // Get the last X months
    const lastMonths = Array.from({ length: months }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7); // YYYY-MM format
    }).reverse();
    
    let data;
    
    if (role === 'student') {
      // For students, get their own attendance
      const { data: attendanceData, error } = await supabase.rpc(
        'get_monthly_attendance_student',
        { student_id: userId, months_count: months }
      );
      
      if (error) throw error;
      data = attendanceData;
    } else if (role === 'lecturer') {
      // For lecturers, get attendance for their courses
      const { data: attendanceData, error } = await supabase.rpc(
        'get_monthly_attendance_lecturer',
        { lecturer_id: userId, months_count: months }
      );
      
      if (error) throw error;
      data = attendanceData;
    } else {
      // For admins, get all attendance
      const { data: attendanceData, error } = await supabase.rpc(
        'get_monthly_attendance_all',
        { months_count: months }
      );
      
      if (error) throw error;
      data = attendanceData;
    }
    
    // Format data for charts, ensuring all months are represented
    const formattedData = lastMonths.map(monthKey => {
      const monthData = data.find(d => d.month === monthKey);
      const shortMonth = new Date(monthKey + '-01').toLocaleString('default', { month: 'short' });
      
      return {
        month: shortMonth,
        present: monthData?.present_count || 0,
        absent: monthData?.absent_count || 0,
        late: monthData?.late_count || 0,
        excused: monthData?.excused_count || 0,
      };
    });
    
    return { data: formattedData, error: null };
  } catch (error) {
    // Fallback to mock data for now if the RPC functions don't exist
    console.error('Error fetching monthly attendance:', error);
    
    // Return mock data structured correctly
    const mockData = Array.from({ length: months }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - i - 1));
      const month = d.toLocaleString('default', { month: 'short' });
      
      return {
        month,
        present: Math.floor(Math.random() * 30) + 20,
        absent: Math.floor(Math.random() * 10),
        late: Math.floor(Math.random() * 5),
        excused: Math.floor(Math.random() * 3),
      };
    });
    
    return { data: mockData, error: handleSupabaseError(error) };
  }
};

/**
 * Calculate distance between two points in meters using the Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}; 