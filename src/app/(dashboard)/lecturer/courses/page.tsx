
import { CourseList } from "@/components/dashboard/course/CourseList";
import { CreateCourseButton } from "@/components/dashboard/course/CreateCourseButton";

export default function CoursesPage() {
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <CreateCourseButton />
      </div>
      <CourseList />
    </div>
  );
}
