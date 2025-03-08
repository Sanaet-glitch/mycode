import { supabase, handleSupabaseError } from './supabaseClient';
import { toast } from '@/components/ui/use-toast';

export interface Course {
  id: string;
  title: string;
  code: string;
  description?: string;
  credit_hours?: number;
  semester?: string;
  year?: number;
  lecturer_id: string;
  created_at: string;
  updated_at?: string;
  status?: 'active' | 'inactive' | 'archived';
  department?: string;
  image_url?: string;
}

export interface Class {
  id: string;
  course_id: string;
  name: string;
  day_of_week?: number; // 0 = Sunday, 1 = Monday, etc.
  start_time?: string;
  end_time?: string;
  room?: string;
  created_at: string;
  updated_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'dropped' | 'completed';
  grade?: string;
  enrollment_date: string;
}

/**
 * Get all courses
 */
export const getAllCourses = async (filters?: {
  status?: 'active' | 'inactive' | 'archived';
  department?: string;
  semester?: string;
  year?: number;
}) => {
  try {
    let query = supabase
      .from('courses')
      .select(`
        *,
        lecturer:profiles!lecturer_id (
          id,
          full_name,
          email
        ),
        classes (*)
      `);
    
    // Apply filters if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.semester) {
      query = query.eq('semester', filters.semester);
    }
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get courses for a lecturer
 */
export const getLecturerCourses = async (lecturerId: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        classes (*)
      `)
      .eq('lecturer_id', lecturerId);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get courses for a student based on enrollments
 */
export const getStudentCourses = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        grade,
        enrollment_date,
        course:courses (
          *,
          lecturer:profiles!lecturer_id (
            id,
            full_name,
            email
          ),
          classes (*)
        )
      `)
      .eq('student_id', studentId);
    
    if (error) throw error;
    
    // Transform the data to make it more usable
    const transformedData = data.map(enrollment => ({
      enrollmentId: enrollment.id,
      enrollmentStatus: enrollment.status,
      grade: enrollment.grade,
      enrollmentDate: enrollment.enrollment_date,
      ...enrollment.course
    }));
    
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Create a new course
 */
export const createCourse = async (course: Omit<Course, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        ...course,
        created_at: new Date().toISOString(),
        status: course.status || 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Course Created",
      description: `${course.title} (${course.code}) has been created successfully.`,
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to Create Course",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Update a course
 */
export const updateCourse = async (courseId: string, updates: Partial<Course>) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Course Updated",
      description: "The course has been updated successfully.",
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to Update Course",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Delete a course
 */
export const deleteCourse = async (courseId: string) => {
  try {
    // First check if the course has any enrollments
    const { count, error: countError } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact' })
      .eq('course_id', courseId);
    
    if (countError) throw countError;
    
    if (count && count > 0) {
      throw new Error(`Cannot delete course with ${count} enrollments. Archive it instead.`);
    }
    
    // Delete the course if there are no enrollments
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
    
    toast({
      title: "Course Deleted",
      description: "The course has been deleted successfully.",
    });
    
    return { error: null };
  } catch (error) {
    toast({
      title: "Failed to Delete Course",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { error: handleSupabaseError(error) };
  }
};

/**
 * Enroll a student in a course
 */
export const enrollStudent = async (studentId: string, courseId: string) => {
  try {
    // Check if already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    // If already enrolled but dropped, reactivate
    if (existingEnrollment && existingEnrollment.status === 'dropped') {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          status: 'active',
          enrollment_date: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Enrollment Reactivated",
        description: "You have been re-enrolled in this course.",
      });
      
      return { data, error: null, action: 'reactivated' };
    }
    
    // If already enrolled and active, return error
    if (existingEnrollment && existingEnrollment.status === 'active') {
      throw new Error("Already enrolled in this course");
    }
    
    // Otherwise create new enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        enrollment_date: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Enrollment Successful",
      description: "You have been enrolled in this course.",
    });
    
    return { data, error: null, action: 'enrolled' };
  } catch (error) {
    toast({
      title: "Enrollment Failed",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { data: null, error: handleSupabaseError(error), action: null };
  }
};

/**
 * Drop a course enrollment
 */
export const dropCourse = async (studentId: string, courseId: string) => {
  try {
    // Find the enrollment
    const { data: enrollment, error: findError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();
    
    if (findError) throw findError;
    
    if (!enrollment) {
      throw new Error("No active enrollment found for this course");
    }
    
    // Update the enrollment status to 'dropped'
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: 'dropped'
      })
      .eq('id', enrollment.id)
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Course Dropped",
      description: "You have dropped this course.",
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to Drop Course",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Create a class for a course
 */
export const createClass = async (classData: Omit<Class, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([{
        ...classData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Class Created",
      description: "The class has been created successfully.",
    });
    
    return { data, error: null };
  } catch (error) {
    toast({
      title: "Failed to Create Class",
      description: (error as Error).message,
      variant: "destructive",
    });
    
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get available courses for a student (courses not enrolled in)
 */
export const getAvailableCourses = async (studentId: string) => {
  try {
    // First get the courses the student is already enrolled in
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .in('status', ['active', 'completed']);
    
    if (enrollmentError) throw enrollmentError;
    
    // Get all the course IDs the student is enrolled in
    const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
    
    // Get courses the student is not enrolled in
    let query = supabase
      .from('courses')
      .select(`
        *,
        lecturer:profiles!lecturer_id (
          id,
          full_name,
          email
        ),
        classes (*)
      `)
      .eq('status', 'active');
    
    if (enrolledCourseIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get class schedule for a student
 */
export const getStudentSchedule = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        course:courses (
          id,
          title,
          code,
          classes (
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            room
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');
    
    if (error) throw error;
    
    // Transform the data to create a schedule array
    const schedule = [];
    
    for (const enrollment of data) {
      const course = enrollment.course;
      if (course && course.classes && course.classes.length > 0) {
        for (const classItem of course.classes) {
          schedule.push({
            courseId: course.id,
            courseTitle: course.title,
            courseCode: course.code,
            classId: classItem.id,
            className: classItem.name,
            dayOfWeek: classItem.day_of_week,
            startTime: classItem.start_time,
            endTime: classItem.end_time,
            room: classItem.room
          });
        }
      }
    }
    
    return { data: schedule, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}; 