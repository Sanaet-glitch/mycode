
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnrollCourseDialog } from "./course/EnrollCourseDialog";

export const StudentCourses = () => {
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ['enrolled-courses'],
    queryFn: async () => {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_date,
          courses (
            id,
            title,
            description
          )
        `)
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      return enrollments.map(enrollment => ({
        id: enrollment.id,
        enrollmentDate: new Date(enrollment.enrollment_date).toLocaleDateString(),
        ...enrollment.courses,
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses you are currently enrolled in</CardDescription>
          </div>
          <Button onClick={() => setIsEnrollDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Enroll in Course
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : enrolledCourses?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You are not enrolled in any courses yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolledCourses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.description || "No description"}</TableCell>
                  <TableCell>{course.enrollmentDate}</TableCell>
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
