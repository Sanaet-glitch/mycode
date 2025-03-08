import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Clock, User, FileText, MessageSquare } from "lucide-react";
import { CourseEngagement } from "@/services/reportingService";
import { formatDistanceToNow } from "date-fns";

interface CourseEngagementCardProps {
  courseData: CourseEngagement[];
  loading: boolean;
}

/**
 * Component to display course engagement metrics
 */
export const CourseEngagementCard = ({ courseData, loading }: CourseEngagementCardProps) => {
  // Function to format the timestamp for last activity
  const formatLastActivity = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown";
    }
  };
  
  // Function to get color class based on completion rate
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.8) return "text-green-600";
    if (rate >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Engagement Metrics</CardTitle>
        <CardDescription>Overview of student activity in courses</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : courseData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseData.map((course) => (
                <TableRow key={course.course_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.course_name}</div>
                      <div className="text-xs text-gray-500">ID: {course.course_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-blue-500" />
                        <span>{course.total_students} total</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{course.active_students} active</span>
                        <span className="mx-1">·</span>
                        <span>{Math.round((course.active_students / course.total_students) * 100)}% active rate</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${getCompletionRateColor(course.completion_rate)}`}>
                      {Math.round(course.completion_rate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg {Math.round(course.avg_time_spent)} min/student
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{course.total_materials} materials</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{course.total_assignments} assignments</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{course.total_discussions} discussions</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      <span>{formatLastActivity(course.last_activity)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">No course engagement data available</p>
          </div>
        )}
        
        {courseData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Courses</div>
              <div className="text-xl font-bold text-blue-700">{courseData.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-gray-600">Avg Completion</div>
              <div className="text-xl font-bold text-green-700">
                {Math.round(courseData.reduce((sum, course) => sum + course.completion_rate, 0) / courseData.length * 100)}%
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Students</div>
              <div className="text-xl font-bold text-purple-700">
                {courseData.reduce((sum, course) => sum + course.total_students, 0)}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-sm text-gray-600">Active Students</div>
              <div className="text-xl font-bold text-orange-700">
                {courseData.reduce((sum, course) => sum + course.active_students, 0)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseEngagementCard; 