
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CourseActions } from "./CourseActions";

interface Course {
  id: string;
  title: string;
  description: string | null;
  enrollment_key: string;
}

interface CoursesTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onViewStudents: (course: Course) => void;
  onManageClasses: (course: Course) => void;
}

export const CoursesTable = ({
  courses,
  onEdit,
  onViewStudents,
  onManageClasses,
}: CoursesTableProps) => {
  return (
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
                <CourseActions
                  onEdit={() => onEdit(course)}
                  onViewStudents={() => onViewStudents(course)}
                  onManageClasses={() => onManageClasses(course)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
