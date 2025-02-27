import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CourseSelectionTableProps {
  selectedCourses: string[];
  onSelectionChange: (courseIds: string[]) => void;
}

export const CourseSelectionTable = ({
  selectedCourses,
  onSelectionChange,
}: CourseSelectionTableProps) => {
  const { data: courses, isLoading } = useQuery({
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

  const toggleCourse = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      onSelectionChange(selectedCourses.filter(id => id !== courseId));
    } else {
      onSelectionChange([...selectedCourses, courseId]);
    }
  };

  const toggleAll = () => {
    if (selectedCourses.length === courses?.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(courses?.map(course => course.id) || []);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedCourses.length === courses?.length}
              onCheckedChange={toggleAll}
            />
          </TableHead>
          <TableHead>Course Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Enrollment Key</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses?.map((course) => (
          <TableRow key={course.id}>
            <TableCell>
              <Checkbox
                checked={selectedCourses.includes(course.id)}
                onCheckedChange={() => toggleCourse(course.id)}
              />
            </TableCell>
            <TableCell>{course.title}</TableCell>
            <TableCell>{course.description || "No description"}</TableCell>
            <TableCell>
              <code className="bg-muted px-2 py-1 rounded">
                {course.enrollment_key}
              </code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}; 