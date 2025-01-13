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
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-none shadow-lg animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Student Dashboard</CardTitle>
              <CardDescription>Mark your attendance securely with location verification</CardDescription>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">Change Role</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Classes Attended</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.present}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.percentage}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Chart */}
            <AttendanceChart data={MOCK_MONTHLY_DATA} />

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle>Class Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {locationError && (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="w-full">
                <label className="text-sm font-medium mb-2 block">Select Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CLASSES.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.schedule}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50/80 rounded-lg backdrop-blur-sm">
                <Button 
                  onClick={checkLocation}
                  className="bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                  disabled={!selectedClass}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Mark Attendance
                </Button>
                
                {location && (
                  <div className="text-sm text-gray-600">
                    Location verified at: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Records
              </Button>
              <Button onClick={handleNotificationToggle} variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Enable Reminders
              </Button>
            </div>

            {/* Excuse Submission Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Absence Excuse</CardTitle>
                <CardDescription>Provide a reason for your absence</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleExcuseSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="excuse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excuse</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your excuse here..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Please provide a detailed explanation for your absence.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">
                      <FileText className="mr-2 h-4 w-4" />
                      Submit Excuse
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
              <div className="bg-white/80 rounded-lg shadow-sm overflow-hidden backdrop-blur-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 divide-y divide-gray-200">
                    {MOCK_ATTENDANCE.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/80 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.className}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
