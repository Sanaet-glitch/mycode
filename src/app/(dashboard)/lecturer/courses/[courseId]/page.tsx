import { CourseDetails } from "@/components/dashboard/course/CourseDetails";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  return (
    <div className="container py-6">
      <CourseDetails courseId={params.courseId} />
    </div>
  );
} 