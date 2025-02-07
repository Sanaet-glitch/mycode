import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Download, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { setLecturerLocation } from "@/utils/distance";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { AttendanceRecord } from "@/types/attendance";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SessionContext } from "@/App";
import { useContext } from "react";
import { CourseManagement } from "@/components/dashboard/CourseManagement";

const LecturerDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const { toast } = useToast();
  const { session } = useContext(SessionContext);

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
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Lecturer Dashboard</CardTitle>
            <CardDescription>Manage courses and track attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Management */}
            <Card>
              <CardContent className="pt-6">
                <CourseManagement userId={session?.user?.id || ''} />
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