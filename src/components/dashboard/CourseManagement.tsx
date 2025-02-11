
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateCourseDialog } from "./course/CreateCourseDialog";
import { EditCourseDialog } from "./course/EditCourseDialog";
import { EnrolledStudentsDialog } from "./course/EnrolledStudentsDialog";
import { ClassScheduleDialog } from "./course/ClassScheduleDialog";
import { CoursesTable } from "./course/CoursesTable";

interface Course {
  id: string;
  title: string;
  description: string | null;
  enrollment_key: string;
}

interface CourseManagementProps {
  userId: string;
}

export const CourseManagement = ({ userId }: CourseManagementProps) => {
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [isClassScheduleOpen, setIsClassScheduleOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleEditClick = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseOpen(true);
  };

  const handleViewStudents = (course: Course) => {
    setSelectedCourse(course);
    setIsStudentsDialogOpen(true);
  };

  const handleManageClasses = (course: Course) => {
    setSelectedCourse(course);
    setIsClassScheduleOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Courses</h2>
        <CreateCourseDialog />
      </div>

      {isLoadingCourses ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin text-primary">Loading...</div>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No courses yet. Create your first course to get started.
        </div>
      ) : (
        <CoursesTable
          courses={courses}
          onEdit={handleEditClick}
          onViewStudents={handleViewStudents}
          onManageClasses={handleManageClasses}
        />
      )}

      <EditCourseDialog
        course={selectedCourse}
        isOpen={isEditCourseOpen}
        onOpenChange={setIsEditCourseOpen}
      />

      <EnrolledStudentsDialog
        course={selectedCourse}
        isOpen={isStudentsDialogOpen}
        onOpenChange={setIsStudentsDialogOpen}
      />

      <ClassScheduleDialog
        course={selectedCourse}
        isOpen={isClassScheduleOpen}
        onOpenChange={setIsClassScheduleOpen}
      />
    </div>
  );
};
