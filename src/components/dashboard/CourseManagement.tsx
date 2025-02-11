
import { useState } from "react";
import { FileEdit, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateCourseDialog } from "./course/CreateCourseDialog";
import { EditCourseDialog } from "./course/EditCourseDialog";
import { EnrolledStudentsDialog } from "./course/EnrolledStudentsDialog";
import { ClassScheduleDialog } from "./course/ClassScheduleDialog";

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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enrollment Key</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.description || "No description"}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded">
                      {course.enrollment_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(course)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudents(course)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageClasses(course)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
