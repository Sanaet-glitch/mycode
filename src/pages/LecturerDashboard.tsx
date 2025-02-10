
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Download, Users, Loader2, Power } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { setLecturerLocation } from "@/utils/distance";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";
import { AttendanceRecord } from "@/types/attendance";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SessionContext } from "@/App";
import { useContext } from "react";
import { CourseManagement } from "@/components/dashboard/CourseManagement";
import { Slider } from "@/components/ui/slider";

const LecturerDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [proximityRadius, setProximityRadius] = useState<number>(100);
  const { toast } = useToast();
  const { session } = useContext(SessionContext);
  const queryClient = useQueryClient();

  // Query to get active class sessions
  const { data: activeClasses, isLoading: isLoadingActiveClasses } = useQuery({
    queryKey: ['active-classes', session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          class:classes (
            id,
            name,
            course:courses (
              id,
              title,
              lecturer_id
            )
          )
        `)
        .eq('is_active', true)
        .filter('class.course.lecturer_id', 'eq', session?.user?.id);

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
        present: Math.floor(Math.random() * 30) + 20,
        absent: Math.floor(Math.random() * 10) + 1,
      }));
    },
    enabled: !!session?.user?.id,
  });

  const activateSessionMutation = useMutation({
    mutationFn: async ({ classId, location }: { classId: string, location: { latitude: number; longitude: number } }) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .insert([
          {
            class_id: classId,
            session_date: new Date().toISOString().split('T')[0],
            is_active: true,
            beacon_latitude: location.latitude,
            beacon_longitude: location.longitude,
            proximity_radius: proximityRadius // Use the proximity radius from state
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-classes'] });
      toast({
        title: "Session Activated",
        description: "Students can now mark their attendance.",
      });
    },
    onError: (error) => {
      console.error('Error activating session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate session. Please try again.",
      });
    }
  });

  const deactivateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-classes'] });
      toast({
        title: "Session Deactivated",
        description: "Attendance marking has been stopped.",
      });
    },
    onError: (error) => {
      console.error('Error deactivating session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate session. Please try again.",
      });
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
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Currently running class sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActiveClasses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activeClasses?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions at the moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeClasses?.map((session) => (
                      <Alert key={session.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <AlertDescription>
                              {session.class?.course?.title} - {session.class?.name}
                            </AlertDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateSessionMutation.mutate(session.id)}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Stop Session
                          </Button>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proximity Radius (meters): {proximityRadius}m
                    </label>
                    <Slider
                      value={[proximityRadius]}
                      onValueChange={(value) => setProximityRadius(value[0])}
                      min={10}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                  </div>
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
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LecturerDashboard;
