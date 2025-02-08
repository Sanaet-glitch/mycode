import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Download, Bell, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateDistance, getLecturerLocation } from "@/utils/distance";
import { Class, AttendanceRecord } from "@/types/attendance";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { StudentCourses } from "@/components/dashboard/StudentCourses";

const MOCK_CLASSES: Class[] = [
  { id: "1", name: "Mathematics 101", schedule: "Mon, Wed 9:00 AM" },
  { id: "2", name: "Physics 201", schedule: "Tue, Thu 11:00 AM" },
  { id: "3", name: "Computer Science 301", schedule: "Mon, Fri 2:00 PM" },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "1", classId: "1", className: "Mathematics 101", date: "2024-02-20", status: "present", location: "Near Lecturer" },
  { id: "2", classId: "2", className: "Physics 201", date: "2024-02-21", status: "present", location: "Near Lecturer" },
  { id: "3", classId: "1", className: "Mathematics 101", date: "2024-02-22", status: "absent", location: "N/A" },
];

const MOCK_MONTHLY_DATA = [
  { month: "Jan", present: 15, absent: 2 },
  { month: "Feb", present: 18, absent: 1 },
  { month: "Mar", present: 12, absent: 3 },
];

const StudentDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      excuse: "",
      date: new Date(),
    },
  });

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

  const calculateAttendanceStats = () => {
    const totalClasses = MOCK_ATTENDANCE.length;
    const presentClasses = MOCK_ATTENDANCE.filter(record => record.status === "present").length;
    const attendancePercentage = (presentClasses / totalClasses) * 100;
    return {
      total: totalClasses,
      present: presentClasses,
      percentage: attendancePercentage.toFixed(1)
    };
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

  const handleExcuseSubmit = (data: { excuse: string }) => {
    toast({
      title: "Excuse Submitted",
      description: "Your absence excuse has been submitted for review.",
    });
  };

  const handleExport = () => {
    exportToCSV(MOCK_ATTENDANCE);
    toast({
      title: "Export Complete",
      description: "Your attendance records have been downloaded.",
    });
  };

  const handleNotificationToggle = () => {
    if (Notification.permission === "granted") {
      MOCK_CLASSES.forEach(cls => {
        scheduleNotification(cls.name, cls.schedule);
      });
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

  const stats = calculateAttendanceStats();

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
