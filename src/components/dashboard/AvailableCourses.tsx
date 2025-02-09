
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { EnrollCourseDialog } from "./course/EnrollCourseDialog";

export const AvailableCourses = () => {
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  const { data: availableCourses, isLoading } = useQuery({
    queryKey: ['available-courses'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          lecturer:lecturer_id (
            id,
            full_name
          )
        `)
        .not('id', 'in', `(${enrolledCourseIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return courses;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Courses</CardTitle>
        <CardDescription>Browse courses you can enroll in</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : availableCourses?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No courses available for enrollment at this time.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lecturer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableCourses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.description || "No description"}</TableCell>
                  <TableCell>{course.lecturer?.full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <EnrollCourseDialog
        isOpen={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
      />
    </Card>
  );
};
