
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Download, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance, getLecturerLocation } from "@/utils/distance";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { StudentCourses } from "@/components/dashboard/StudentCourses";
import { AvailableCourses } from "@/components/dashboard/AvailableCourses";
import { ClassSchedule } from "@/components/dashboard/ClassSchedule";

const MOCK_MONTHLY_DATA = [
  { month: "Jan", present: 15, absent: 2 },
  { month: "Feb", present: 18, absent: 1 },
  { month: "Mar", present: 12, absent: 3 },
];

const StudentDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const scheduleNotification = (className: string, schedule: string) => {
    if (Notification.permission === "granted") {
      const notification = new Notification("Class Reminder", {
        body: `Your ${className} class starts in 15 minutes (${schedule})`,
        icon: "/favicon.ico"
      });
    }
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

        const lecturerLocation = getLecturerLocation();
        if (!lecturerLocation) {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Lecturer's location is not available. Please wait for the lecturer to set their location.",
          });
          return;
        }

        const distanceFromLecturer = calculateDistance(userLocation, lecturerLocation);
        const isWithinRange = distanceFromLecturer <= 100;

        if (isWithinRange) {
          toast({
            title: "Location verified",
            description: "You are within range of your lecturer. Attendance marked.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "You must be within 100 meters of your lecturer to mark attendance.",
          });
        }
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
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Mark Attendance
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
