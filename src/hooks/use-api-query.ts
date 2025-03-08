import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for fetching courses using React Query
 */
export function useCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all courses
  const useAllCourses = () => useQuery({
    queryKey: ['courses'],
    queryFn: () => apiClient.courses.getAll(),
  });

  // Get a specific course by ID
  const useCourse = (id: string) => useQuery({
    queryKey: ['courses', id],
    queryFn: () => apiClient.courses.getById(id),
    enabled: !!id,
  });

  // Get courses for a specific student
  const useStudentCourses = (studentId: string) => useQuery({
    queryKey: ['courses', 'student', studentId],
    queryFn: () => apiClient.courses.getByStudentId(studentId),
    enabled: !!studentId,
  });

  // Get courses for a specific lecturer
  const useLecturerCourses = (lecturerId: string) => useQuery({
    queryKey: ['courses', 'lecturer', lecturerId],
    queryFn: () => apiClient.courses.getByLecturerId(lecturerId),
    enabled: !!lecturerId,
  });

  return {
    useAllCourses,
    useCourse,
    useStudentCourses,
    useLecturerCourses,
  };
}

/**
 * Custom hook for attendance related queries and mutations
 */
export function useAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mark attendance mutation
  const useMarkAttendance = () => {
    return useMutation({
      mutationFn: (params: {
        studentId: string;
        courseId: string;
        sessionId: string;
        latitude: number;
        longitude: number;
      }) => apiClient.attendance.markAttendance(params),
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        });
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to mark attendance",
          variant: "destructive",
        });
      },
    });
  };

  // Get student attendance
  const useStudentAttendance = (studentId: string, courseId?: string) => {
    return useQuery({
      queryKey: ['attendance', 'student', studentId, courseId].filter(Boolean) as QueryKey,
      queryFn: () => apiClient.attendance.getStudentAttendance(studentId, courseId),
      enabled: !!studentId,
    });
  };

  // Get course attendance
  const useCourseAttendance = (courseId: string, sessionId?: string) => {
    return useQuery({
      queryKey: ['attendance', 'course', courseId, sessionId].filter(Boolean) as QueryKey,
      queryFn: () => apiClient.attendance.getCourseAttendance(courseId, sessionId),
      enabled: !!courseId,
    });
  };

  return {
    useMarkAttendance,
    useStudentAttendance,
    useCourseAttendance,
  };
}

/**
 * Custom hook for user profile queries and mutations
 */
export function useProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user profile
  const useUserProfile = (userId: string) => {
    return useQuery({
      queryKey: ['profile', userId],
      queryFn: () => apiClient.profiles.get(userId),
      enabled: !!userId,
    });
  };

  // Update user profile
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: ({ userId, updates }: { userId: string; updates: any }) => 
        apiClient.profiles.update(userId, updates),
      onSuccess: (data, variables) => {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Invalidate profile query
        queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        });
      },
    });
  };

  return {
    useUserProfile,
    useUpdateProfile,
  };
} 