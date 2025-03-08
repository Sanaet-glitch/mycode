import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, MapPin, School, User, BookOpen, Users, BarChart, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Demo data for mockup
const MOCK_COURSES = [
  {
    id: "c1",
    name: "Introduction to Computer Science",
    code: "CS101",
    instructor: "Dr. John Smith",
    schedule: "Mon, Wed 10:00-11:30",
    location: "Building A, Room 101",
    sessions: [
      {
        id: "s1",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        startTime: "10:00",
        endTime: "11:30",
        location: "Building A, Room 101",
        lecturer: "Dr. John Smith"
      },
      {
        id: "s2",
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        startTime: "10:00",
        endTime: "11:30",
        location: "Building A, Room 101",
        lecturer: "Dr. John Smith"
      }
    ]
  },
  {
    id: "c2",
    name: "Calculus I",
    code: "MATH201",
    instructor: "Dr. Jane Doe",
    schedule: "Tue, Thu 13:00-14:30",
    location: "Building B, Room 202",
    sessions: [
      {
        id: "s3",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        startTime: "13:00",
        endTime: "14:30",
        location: "Building B, Room 202",
        lecturer: "Dr. Jane Doe"
      }
    ]
  },
  {
    id: "c3",
    name: "Introduction to Psychology",
    code: "PSY101",
    instructor: "Prof. Robert Johnson",
    schedule: "Wed, Fri 15:00-16:30",
    location: "Building C, Room 303",
    sessions: [
      {
        id: "s4",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        startTime: "15:00",
        endTime: "16:30",
        location: "Building C, Room 303",
        lecturer: "Prof. Robert Johnson"
      }
    ]
  }
];

const MOCK_ATTENDANCE = [
  {
    id: "a1",
    courseId: "c1",
    sessionId: "past-session-1",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "present"
  },
  {
    id: "a2",
    courseId: "c1",
    sessionId: "past-session-2",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "present"
  },
  {
    id: "a3",
    courseId: "c2",
    sessionId: "past-session-3",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "absent"
  },
  {
    id: "a4",
    courseId: "c3",
    sessionId: "past-session-4",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "present"
  }
];

// Simplified components for demo
const CourseList = ({ courses }: { courses: any[] }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium">My Enrolled Courses</h3>
    <div className="space-y-4">
      {courses.map(course => (
        <Card key={course.id}>
          <CardHeader>
            <CardTitle>{course.name}</CardTitle>
            <CardDescription>{course.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{course.instructor}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{course.schedule}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{course.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const AttendanceHistory = ({ records, courses }: { records: any[], courses: any[] }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium">Recent Attendance</h3>
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Course</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const course = courses.find(c => c.id === record.courseId);
                return (
                  <tr key={record.id} className="border-b">
                    <td className="p-3">{format(new Date(record.timestamp), "MMM d, yyyy")}</td>
                    <td className="p-3">{course?.name || "Unknown Course"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        record.status === "present" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

const QRCodeScanner = ({ onScan }: { onScan: (data: string) => void }) => (
  <div className="flex h-full w-full items-center justify-center bg-gray-100">
    <div className="text-center">
      <p className="text-muted-foreground">Camera Preview Would Appear Here</p>
      <Button
        className="mt-4"
        onClick={() => 
          onScan(JSON.stringify({ 
            sessionId: "demo-session", 
            courseId: "c1" 
          }))
        }
      >
        Simulate Scan
      </Button>
    </div>
  </div>
);

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isScanning, setIsScanning] = useState(false);
  
  // Using mock data for demo
  const courses = MOCK_COURSES;
  const enrolledCourses = MOCK_COURSES;
  const attendanceRecords = MOCK_ATTENDANCE;
  const coursesLoading = false;
  const attendanceLoading = false;
  
  // Calculate attendance statistics
  const calculateAttendanceStats = () => {
    if (!enrolledCourses.length || !attendanceRecords.length) {
      return {
        totalSessions: 0,
        attendedSessions: 0,
        attendanceRate: 0,
        courseStats: []
      };
    }
    
    // For demo, we'll use a fixed number for total sessions
    const totalSessions = 10;
    const attendedSessions = attendanceRecords.filter(r => r.status === "present").length;
    const attendanceRate = Math.round((attendedSessions / totalSessions) * 100);
    
    // Calculate per-course statistics
    const courseStats = enrolledCourses.map(course => {
      // For demo, each course has a fixed number of sessions
      const courseSessions = 4;
      const courseAttendances = attendanceRecords.filter(
        record => record.courseId === course.id && record.status === "present"
      ).length;
      
      return {
        courseId: course.id,
        courseName: course.name,
        attendanceRate: Math.round((courseAttendances / courseSessions) * 100),
        attendedSessions: courseAttendances,
        totalSessions: courseSessions
      };
    });
    
    return {
      totalSessions,
      attendedSessions,
      attendanceRate,
      courseStats
    };
  };

  const stats = calculateAttendanceStats();

  // Handler for marking attendance via QR code
  const handleQRCodeScanned = async (data: string) => {
    try {
      // Parse the QR code data
      const attendanceData = JSON.parse(data);
      
      if (!attendanceData.sessionId || !attendanceData.courseId) {
        throw new Error("Invalid QR code data");
      }
      
      // For demo, just show a success message
      toast({
        title: "Attendance Marked",
        description: "Your attendance has been recorded successfully.",
      });
      
      // Close scanner
      setIsScanning(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get upcoming classes
  const getUpcomingClasses = () => {
    if (!enrolledCourses.length) return [];
    
    const now = new Date();
    const upcoming = [];
    
    for (const course of enrolledCourses) {
      if (!course.sessions) continue;
      
      for (const session of course.sessions) {
        const sessionDate = new Date(session.date);
        
        // If session is in the future and within next 7 days
        if (sessionDate > now && sessionDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          upcoming.push({
            courseId: course.id,
            courseName: course.name,
            session
          });
        }
      }
    }
    
    // Sort by date
    return upcoming.sort((a, b) => 
      new Date(a.session.date).getTime() - new Date(b.session.date).getTime()
    );
  };

  const upcomingClasses = getUpcomingClasses();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "Student"}!
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsScanning(true)}
            className="flex items-center"
          >
            <School className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="attendance">Attendance History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrolledCourses.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total courses enrolled
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.attendedSessions} of {stats.totalSessions} sessions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingClasses.length}</div>
                <p className="text-xs text-muted-foreground">
                  Next 7 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Lowest Attendance</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.courseStats.length > 0 
                    ? `${Math.min(...stats.courseStats.map(c => c.attendanceRate))}%` 
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.courseStats.length > 0 
                    ? stats.courseStats.reduce((prev, curr) => 
                        prev.attendanceRate < curr.attendanceRate ? prev : curr
                      ).courseName 
                    : "No courses yet"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>Your schedule for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading || attendanceLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner />
                </div>
              ) : upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingClasses.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 rounded-md border p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <School className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.courseName}</h4>
                        <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            <span>{format(new Date(item.session.date), "EEEE, MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            <span>{item.session.startTime} - {item.session.endTime}</span>
                          </div>
                          {item.session.location && (
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-3.5 w-3.5" />
                              <span>{item.session.location}</span>
                            </div>
                          )}
                          {item.session.lecturer && (
                            <div className="flex items-center">
                              <User className="mr-1 h-3.5 w-3.5" />
                              <span>{item.session.lecturer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                  <h3 className="font-medium">No Upcoming Classes</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any classes scheduled in the next 7 days.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          <CourseList courses={enrolledCourses} />
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceHistory 
            records={attendanceRecords}
            courses={courses}
          />
        </TabsContent>
      </Tabs>
      
      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Scan Attendance QR Code</CardTitle>
              <CardDescription>
                Point your camera at the QR code displayed by your lecturer
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative h-60 w-full overflow-hidden rounded-md">
                <QRCodeScanner onScan={handleQRCodeScanned} />
              </div>
            </CardContent>
            <div className="flex justify-center p-4">
              <Button variant="outline" onClick={() => setIsScanning(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 