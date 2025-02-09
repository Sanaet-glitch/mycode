
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

export const ClassSchedule = () => {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['class-schedule'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          venue,
          course:courses (
            title
          )
        `)
        .in('course_id', enrolledCourseIds)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return classes;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>Your weekly class schedule</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : schedule?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No classes scheduled. Enroll in courses to see your schedule.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Venue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule?.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell>{DAYS_OF_WEEK[classItem.day_of_week - 1]}</TableCell>
                  <TableCell>
                    {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>{classItem.course?.title}</TableCell>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.venue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
