
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
}

interface EnrolledStudentsDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnrolledStudentsDialog = ({ course, isOpen, onOpenChange }: EnrolledStudentsDialogProps) => {
  const { data: enrolledStudents, isLoading } = useQuery({
    queryKey: ['enrolled-students', course?.id],
    queryFn: async () => {
      if (!course?.id) throw new Error('Course ID is required');

      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_date,
          profiles:student_id (
            full_name
          )
        `)
        .eq('course_id', course.id)
        .order('enrollment_date', { ascending: false });

      if (error) {
        console.error('Error fetching enrolled students:', error);
        throw error;
      }

      return enrollments.map(enrollment => ({
        id: enrollment.id,
        full_name: enrollment.profiles?.full_name || 'Unknown',
        enrollment_date: new Date(enrollment.enrollment_date).toLocaleDateString(),
      }));
    },
    enabled: !!course?.id && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Enrolled Students</DialogTitle>
          <DialogDescription>
            Students enrolled in {course?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : enrolledStudents?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students enrolled in this course yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.enrollment_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
