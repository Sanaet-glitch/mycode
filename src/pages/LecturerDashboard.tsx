import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Download, Users, FileEdit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { setLecturerLocation } from "@/utils/distance";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { exportToCSV } from "@/utils/export";

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface Class {
  id: string;
  name: string;
  schedule: string;
  students: Student[];
}

const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "John Doe", studentId: "STU001" },
  { id: "2", name: "Jane Smith", studentId: "STU002" },
  { id: "3", name: "Bob Johnson", studentId: "STU003" },
];

const MOCK_ATTENDANCE_DATA = [
  { month: "Jan", present: 42, absent: 8 },
  { month: "Feb", present: 38, absent: 12 },
  { month: "Mar", present: 45, absent: 5 },
];

const LecturerDashboard = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [newClassName, setNewClassName] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const { toast } = useToast();

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

  const handleCreateClass = () => {
    if (!newClassName || !newSchedule) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    const newClass: Class = {
      id: `class-${classes.length + 1}`,
      name: newClassName,
      schedule: newSchedule,
      students: [],
    };

    setClasses([...classes, newClass]);
    setNewClassName("");
    setNewSchedule("");
    toast({
      title: "Class Created",
      description: "New class has been successfully created.",
    });
  };

  const handleExportAttendance = () => {
    const attendanceData = MOCK_ATTENDANCE_DATA.map(record => ({
      id: `monthly-${record.month}`,
      classId: "all",
      className: "All Classes",
      date: `${record.month} 2024`,
      status: "present",
      location: "Various"
    }));
    
    exportToCSV(attendanceData);
    toast({
      title: "Export Complete",
      description: "Attendance data has been exported successfully.",
    });
  };

  const handleBulkAttendance = () => {
    toast({
      title: "Bulk Attendance Marked",
      description: "Attendance has been marked for all present students.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Lecturer Dashboard</CardTitle>
              <CardDescription>Manage classes and track attendance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">Change Role</Button>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>Add a new class to your schedule.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Class Name</Label>
                      <Input
                        placeholder="Enter class name"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Schedule</Label>
                      <Input
                        placeholder="e.g., Mon, Wed 9:00 AM"
                        value={newSchedule}
                        onChange={(e) => setNewSchedule(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateClass}>Create Class</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {locationError && (
              <Alert variant="destructive">
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attendance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceChart data={MOCK_ATTENDANCE_DATA} />
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
            </div>

            {/* Class Management */}
            <Card>
              <CardHeader>
                <CardTitle>Class Management</CardTitle>
                <CardDescription>Select a class to manage students and attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.schedule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedClass && (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Attendance Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {MOCK_STUDENTS.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>{student.studentId}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>
                                <Select defaultValue="present">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="excused">Excused</SelectItem>
                                  </SelectContent>
                                </Select>
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
                </div>
              </CardContent>
            </Card>

            {location && (
              <div className="text-sm text-gray-600 text-center">
                Location beacon active at: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LecturerDashboard;