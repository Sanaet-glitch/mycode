
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCourseManagement } from "@/hooks/use-course-management";
import { LoadingState } from "@/components/ui/loading-state";

export const CourseList = () => {
  const { useCourses } = useCourseManagement();
  const { data: courses, isLoading } = useCourses();

  if (isLoading) {
    return <LoadingState message="Loading courses..." />;
  }

  return (
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
            <TableCell>{course.description}</TableCell>
            <TableCell>
              <code className="bg-muted px-2 py-1 rounded">
                {course.enrollment_key}
              </code>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/lecturer/courses/${course.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
