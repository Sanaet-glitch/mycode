import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { 
  getStudentCourses, 
  getLecturerCourses, 
  enrollStudent, 
  dropCourse,
  getAvailableCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getStudentSchedule,
  Course,
  Class,
  createClass
} from '@/services/courseService';

/**
 * Hook for student course management
 */
export function useStudentCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get courses the student is enrolled in
  const enrolledCourses = useQuery({
    queryKey: ['student-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getStudentCourses(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Get courses the student can enroll in
  const availableCourses = useQuery({
    queryKey: ['available-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getAvailableCourses(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Get student's class schedule
  const schedule = useQuery({
    queryKey: ['student-schedule', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getStudentSchedule(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation for enrolling in a course
  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await enrollStudent(user.id, courseId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-schedule'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Enroll',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for dropping a course
  const drop = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await dropCourse(user.id, courseId);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-schedule'] });
      
      toast({
        title: 'Course Dropped',
        description: 'You have successfully dropped the course.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Drop Course',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  return {
    enrolledCourses: enrolledCourses.data || [],
    isLoadingEnrolledCourses: enrolledCourses.isLoading,
    availableCourses: availableCourses.data || [],
    isLoadingAvailableCourses: availableCourses.isLoading,
    schedule: schedule.data || [],
    isLoadingSchedule: schedule.isLoading,
    isEnrolling: enroll.isPending,
    isDropping: drop.isPending,
    enrollInCourse: enroll.mutate,
    dropCourse: drop.mutate,
  };
}

/**
 * Hook for lecturer course management
 */
export function useLecturerCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get courses the lecturer teaches
  const courses = useQuery({
    queryKey: ['lecturer-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await getLecturerCourses(user.id);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation for creating a new course
  const create = useMutation({
    mutationFn: async (courseData: Omit<Course, 'id' | 'created_at' | 'lecturer_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await createCourse({
        ...courseData,
        lecturer_id: user.id,
      });
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-courses'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Course',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating a course
  const update = useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: Partial<Course> }) => {
      const result = await updateCourse(courseId, data);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-courses'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Course',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting a course
  const remove = useMutation({
    mutationFn: async (courseId: string) => {
      const result = await deleteCourse(courseId);
      if (result.error) throw result.error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-courses'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Delete Course',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating a class for a course
  const createClassForCourse = useMutation({
    mutationFn: async (classData: Omit<Class, 'id' | 'created_at'>) => {
      const result = await createClass(classData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-courses'] });
      
      toast({
        title: 'Class Created',
        description: 'The class has been successfully created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Class',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  return {
    courses: courses.data || [],
    isLoadingCourses: courses.isLoading,
    isCreatingCourse: create.isPending,
    isUpdatingCourse: update.isPending,
    isDeletingCourse: remove.isPending,
    isCreatingClass: createClassForCourse.isPending,
    createCourse: create.mutate,
    updateCourse: update.mutate,
    deleteCourse: remove.mutate,
    createClass: createClassForCourse.mutate,
  };
} 