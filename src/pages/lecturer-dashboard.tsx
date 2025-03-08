import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Users, Calendar, QrCode, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function LecturerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

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
          <h1 className="text-3xl font-bold tracking-tight">Lecturer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "Lecturer"}!
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsGeneratingQR(true)}
            className="flex items-center"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generate Attendance QR
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Current semester
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses you are teaching this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="font-medium">Introduction to Computer Science</div>
                <div className="text-sm text-muted-foreground">CS101 • Mon, Wed 10:00-11:30 • 42 students</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="font-medium">Data Structures and Algorithms</div>
                <div className="text-sm text-muted-foreground">CS201 • Tue, Thu 13:00-14:30 • 28 students</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="font-medium">Database Systems</div>
                <div className="text-sm text-muted-foreground">CS301 • Fri 15:00-18:00 • 17 students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Sessions</CardTitle>
            <CardDescription>Last 5 attendance sessions you've recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="font-medium">CS101 - Introduction to Computer Science</div>
                <div className="text-sm text-muted-foreground">Yesterday • 38/42 students present (90%)</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="font-medium">CS201 - Data Structures and Algorithms</div>
                <div className="text-sm text-muted-foreground">2 days ago • 22/28 students present (79%)</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="font-medium">CS301 - Database Systems</div>
                <div className="text-sm text-muted-foreground">3 days ago • 15/17 students present (88%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal - Placeholder */}
      {isGeneratingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Attendance QR Code</CardTitle>
              <CardDescription>
                Display this QR code for students to scan
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative h-60 w-60 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-2">QR Code would appear here</p>
                  <p className="text-xs text-muted-foreground">Valid for 5 minutes</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="font-medium">CS101 - Introduction to Computer Science</p>
                <p className="text-sm text-muted-foreground">Monday, 10:00-11:30</p>
              </div>
            </CardContent>
            <div className="flex justify-center p-4">
              <Button variant="outline" onClick={() => setIsGeneratingQR(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 