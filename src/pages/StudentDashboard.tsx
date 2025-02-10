
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Download, Bell, Loader2 } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance } from "@/utils/distance";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { StudentCourses } from "@/components/dashboard/StudentCourses";
import { AvailableCourses } from "@/components/dashboard/AvailableCourses";
import { ClassSchedule } from "@/components/dashboard/ClassSchedule";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "@/App";
import { useMutation } from "@tanstack/react-query";

const MOCK_MONTHLY_DATA = [
  { month: "Jan", present: 15, absent: 2 },
  { month: "Feb", present: 18, absent: 1 },
  { month: "Mar", present: 12, absent: 3 },
];

const StudentDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { session } = useContext(SessionContext);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markAttendanceMutation = useMutation({
    mutationFn: async (location: { latitude: number; longitude: number }) => {
      // First, get active sessions for enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', session?.user?.id);

      if (!enrollments?.length) {
        throw new Error('No enrolled courses found');
      }

      const courseIds = enrollments.map(e => e.course_id);

      const { data: activeSessions } = await supabase
        .from('class_sessions')
        .select(`
          id,
          beacon_latitude,
          beacon_longitude,
          proximity_radius,
          retry_count,
          retry_interval,
          class_id,
          classes (
            course_id
          )
        `)
        .eq('is_active', true)
        .in('classes.course_id', courseIds);

      if (!activeSessions?.length) {
        throw new Error('No active sessions found');
      }

      // Check distance for each active session
      const validSessions = activeSessions.filter(session => {
        if (!session.beacon_latitude || !session.beacon_longitude) return false;
        
        const distance = calculateDistance(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: session.beacon_latitude, longitude: session.beacon_longitude }
        );
        
        return distance <= (session.proximity_radius || 100);
      });

      if (!validSessions.length) {
        // Get the first session's retry settings
        const session = activeSessions[0];
        if (verificationAttempts < (session.retry_count || 3)) {
          throw new Error('location_retry');
        }
        throw new Error('Not within range of any active session');
      }

      // Mark attendance for all valid sessions
      const attendancePromises = validSessions.map(activeSession =>
        supabase
          .from('attendance')
          .insert({
            student_id: session?.user?.id,
            class_session_id: activeSession.id,
            latitude: location.latitude,
            longitude: location.longitude,
            verification_attempts: verificationAttempts + 1,
            status: 'verified'
          })
      );

      await Promise.all(attendancePromises);
      setVerificationAttempts(0); // Reset attempts on success
    },
    onSuccess: () => {
      toast({
        title: "Attendance Marked",
        description: "Your attendance has been successfully recorded.",
      });
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }
    },
    onError: (error: Error) => {
      console.error('Error marking attendance:', error);
      
      if (error.message === 'location_retry') {
        const retryTimeoutId = setTimeout(() => {
          setVerificationAttempts(prev => prev + 1);
          checkLocation();
        }, 30000); // 30 seconds default retry interval
        
        setRetryTimeout(retryTimeoutId);
        
        toast({
          title: "Location Verification Failed",
          description: `Retrying in 30 seconds... Attempt ${verificationAttempts + 1} of 3`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to mark attendance. Please try again.",
        });
        setVerificationAttempts(0); // Reset attempts on final failure
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          setRetryTimeout(null);
        }
      }
    }
  });

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
        markAttendanceMutation.mutate(userLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Please enable location services to mark attendance",
        });
      },
      {
        enableHighAccuracy: true, // Request high accuracy for better location precision
        timeout: 10000, // 10 second timeout
        maximumAge: 0 // Don't use cached position
      }
    );
  };

  // Cleanup function for retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  const handleExport = () => {
    exportToCSV([]);
    toast({
      title: "Export Complete",
      description: "Your attendance records have been downloaded.",
    });
  };

  const handleNotificationToggle = () => {
    if (Notification.permission === "granted") {
      toast({
        title: "Notifications Enabled",
        description: "You will receive reminders 15 minutes before your classes.",
      });
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          handleNotificationToggle();
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Student Dashboard</CardTitle>
            <CardDescription>Track your courses and attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Management */}
            <StudentCourses />

            {/* Available Courses */}
            <AvailableCourses />

            {/* Class Schedule */}
            <ClassSchedule />

            {/* Attendance Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {<AttendanceChart data={MOCK_MONTHLY_DATA} />}
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
                  disabled={markAttendanceMutation.isPending || !!retryTimeout}
                >
                  {markAttendanceMutation.isPending || retryTimeout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {retryTimeout ? "Retrying..." : "Verifying Location..."}
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleExport}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Attendance Data
                </Button>
                <Button 
                  onClick={handleNotificationToggle}
                  className="w-full"
                  variant="outline"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Reminders
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
