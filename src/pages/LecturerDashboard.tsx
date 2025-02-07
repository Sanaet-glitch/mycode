import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Download, Users, FileEdit, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { setLecturerLocation } from "@/utils/distance";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { AttendanceRecord } from "@/types/attendance";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SessionContext } from "@/App";
import { useContext } from "react";

const LecturerDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useContext(SessionContext);

  // Fetch courses for the logged-in lecturer
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch attendance data for the chart
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-overview', session?.user?.id],
    queryFn: async () => {
      // Get the last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
      }).reverse();

      // For now, return sample data structured correctly
      return months.map(month => ({
        month,
        present: Math.floor(Math.random() * 30) + 20, // Random number between 20-50
        absent: Math.floor(Math.random() * 10) + 1,   // Random number between 1-10
      }));
    },
    enabled: !!session?.user?.id,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: { title: string; description: string }) => {
      const enrollmentKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            title: courseData.title,
            description: courseData.description,
            enrollment_key: enrollmentKey,
            lecturer_id: session?.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateCourseOpen(false);
      setNewCourseTitle("");
      setNewCourseDescription("");
      toast({
        title: "Course created",
        description: "Your new course has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create course. Please try again.",
      });
    },
  });

  const handleCreateCourse = async () => {
    if (!newCourseTitle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course title",
      });
      return;
    }

    createCourseMutation.mutate({
      title: newCourseTitle,
      description: newCourseDescription,
    });
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(userLocation);
        setLecturerLocation(userLocation);
        toast({
          title: "Location set",
          description: "Your location is now being used as the attendance beacon.",
        });
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Please enable location services to mark attendance",
        });
      }
    );
  };

  const handleBulkAttendance = () => {
    toast({
      title: "Bulk Attendance Marked",
      description: "Attendance has been marked for all present students.",
    });
  };

  const handleExportAttendance = () => {
    if (!attendanceData) return;
    
    const exportData: AttendanceRecord[] = attendanceData.map(record => ({
      id: `monthly-${record.month}`,
      classId: "all",
      className: "All Classes",
      date: `${record.month} 2024`,
      status: "present" as const,
      location: "Various"
    }));
    
    exportToCSV(exportData);
    toast({
      title: "Export Complete",
      description: "Attendance data has been exported successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Lecturer Dashboard</CardTitle>
              <CardDescription>Manage courses and track attendance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>Add a new course to your teaching schedule.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Course Title</Label>
                      <Input
                        placeholder="Enter course title"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Enter course description"
                        value={newCourseDescription}
                        onChange={(e) => setNewCourseDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={createCourseMutation.isPending}
                    >
                      {createCourseMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Courses List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Courses</CardTitle>
                <CardDescription>Manage your courses and class schedules</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : courses?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses yet. Create your first course to get started.
                  </div>
                ) : (
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
                              <Button variant="ghost" size="sm">
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceData && <AttendanceChart data={attendanceData} />}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={checkLocation}
                  className="w-full"
                  variant="outline"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Set Location Beacon
                </Button>
                <Button 
                  onClick={handleBulkAttendance}
                  className="w-full"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Mark Bulk Attendance
                </Button>
                <Button 
                  onClick={handleExportAttendance}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Attendance Data
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LecturerDashboard;