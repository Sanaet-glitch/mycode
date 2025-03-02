
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  courseArchiveApi, 
  courseCategoryApi, 
  courseTagApi, 
  courseMaterialApi 
} from "@/lib/api/course-management";
import { useToast } from "@/hooks/use-toast";
import { CourseManagementError } from "@/lib/api/errors";
import { supabase } from "@/integrations/supabase/client";
import { CourseMaterial } from "@/types/database";

export const useCourseManagement = (courseId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Courses
  const useCourses = () => useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Archives
  const useArchives = () => useQuery({
    queryKey: ['course-archives'],
    queryFn: courseArchiveApi.getArchives,
  });

  const useArchiveCourse = () => useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason?: string }) => 
      courseArchiveApi.archiveCourse(courseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-archives'] });
      toast({
        title: "Course Archived",
        description: "The course has been successfully archived.",
      });
    },
    onError: (error: Error) => {
      console.error('Archive error:', error);
      toast({
        variant: "destructive",
        title: "Archive Failed",
        description: error instanceof CourseManagementError 
          ? error.message 
          : "Failed to archive course. Please try again.",
      });
    },
  });

  // Categories
  const useCategories = () => useQuery({
    queryKey: ['course-categories'],
    queryFn: courseCategoryApi.getCategories,
  });

  // Tags
  const useTags = () => useQuery({
    queryKey: ['course-tags'],
    queryFn: courseTagApi.getTags,
  });

  const useCourseTags = (courseId: string) => useQuery({
    queryKey: ['course-tags', courseId],
    queryFn: () => courseTagApi.getCoursesTags(courseId),
    enabled: !!courseId,
  });

  // Materials
  const useMaterials = (courseId: string) => useQuery({
    queryKey: ['course-materials', courseId],
    queryFn: () => courseMaterialApi.getMaterials(courseId),
    enabled: !!courseId,
  });

  return {
    useCourses,
    useArchives,
    useArchiveCourse,
    useCategories,
    useTags,
    useCourseTags,
    useMaterials,
    courseMaterialApi
  };
};
