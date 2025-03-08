import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

/**
 * Centralized API client for handling data fetching operations
 * Provides typed methods for common operations
 */
export const apiClient = {
  // Course related operations
  courses: {
    getAll: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*");
      
      if (error) throw error;
      return data;
    },
    
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    getByStudentId: async (studentId: string) => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id, courses(*)")
        .eq("student_id", studentId);
      
      if (error) throw error;
      return data;
    },
    
    getByLecturerId: async (lecturerId: string) => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("lecturer_id", lecturerId);
      
      if (error) throw error;
      return data;
    }
  },
  
  // Attendance related operations
  attendance: {
    markAttendance: async (params: {
      studentId: string;
      courseId: string;
      sessionId: string;
      latitude: number;
      longitude: number;
    }) => {
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          student_id: params.studentId,
          course_id: params.courseId,
          session_id: params.sessionId,
          latitude: params.latitude,
          longitude: params.longitude,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    getStudentAttendance: async (studentId: string, courseId?: string) => {
      let query = supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId);
        
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    getCourseAttendance: async (courseId: string, sessionId?: string) => {
      let query = supabase
        .from("attendance")
        .select("*, students(*)")
        .eq("course_id", courseId);
        
      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },
  
  // User profile operations
  profiles: {
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    update: async (userId: string, updates: Partial<Tables["profiles"]["Row"]>) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
}; 