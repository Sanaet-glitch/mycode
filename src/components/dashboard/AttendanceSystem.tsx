import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  Radio, 
  User, 
  Scan, 
  Settings, 
  AlertCircle,
  MapPin
} from "lucide-react";

// Sample data - replace with actual data from your database
const SAMPLE_STUDENTS = [
  { id: "STU001", name: "Alice Johnson", status: "present", distance: 8, lastSeen: "2 mins ago" },
  { id: "STU002", name: "Bob Smith", status: "present", distance: 15, lastSeen: "5 mins ago" },
  { id: "STU003", name: "Carol Williams", status: "pending", distance: 25, lastSeen: "10 mins ago" },
  { id: "STU004", name: "Dave Brown", status: "absent", distance: 40, lastSeen: "1 hour ago" },
  { id: "STU005", name: "Eve Davis", status: "late", distance: 12, lastSeen: "8 mins ago" },
  { id: "STU006", name: "Frank Miller", status: "pending", distance: 35, lastSeen: "15 mins ago" },
  { id: "STU007", name: "Grace Wilson", status: "present", distance: 18, lastSeen: "3 mins ago" },
  { id: "STU008", name: "Hannah Taylor", status: "absent", distance: 45, lastSeen: "2 hours ago" },
];

const StudentCard = ({ student }: { student: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500";
      case "absent": return "bg-red-500";
      case "late": return "bg-yellow-500";
      case "pending": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-4 border rounded-lg flex items-center gap-4 bg-card">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(student.status)}`} />
      <div className="flex-1">
        <h3 className="font-medium">{student.name}</h3>
        <div className="flex items-center text-xs text-muted-foreground gap-1">
          <MapPin size={12} /> {student.distance} meters away
        </div>
        <div className="text-xs text-muted-foreground">
          Last seen: {student.lastSeen}
        </div>
      </div>
      <Badge 
        variant={
          student.status === "present" ? "success" : 
          student.status === "absent" ? "destructive" : 
          student.status === "late" ? "warning" : "outline"
        }
        className="capitalize"
      >
        {student.status}
      </Badge>
    </div>
  );
};

export function AttendanceSystem() {
  const [isBeaconActive, setIsBeaconActive] = useState(false);
  const [proximityRadius, setProximityRadius] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionEndsAt, setSessionEndsAt] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(30);
    return date;
  });
  
  // Calculate time remaining
  const calculateTimeRemaining = () => {
    const diff = sessionEndsAt.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current formatted time
  const getFormattedTime = () => {
    return currentTime.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      hour12: true 
    });
  };

  // Get current formatted date
  const getFormattedDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate attendance statistics
  const statistics = {
    present: SAMPLE_STUDENTS.filter(s => s.status === "present").length,
    absent: SAMPLE_STUDENTS.filter(s => s.status === "absent").length,
    late: SAMPLE_STUDENTS.filter(s => s.status === "late").length,
    total: SAMPLE_STUDENTS.length
  };

  const presentPercentage = Math.round((statistics.present / statistics.total) * 100);
  const latePercentage = Math.round((statistics.late / statistics.total) * 100);
  const absentPercentage = Math.round((statistics.absent / statistics.total) * 100);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Attendance System</h1>
          <p className="text-muted-foreground">Monitor student attendance in real-time with location-based tracking</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <p className="text-muted-foreground">{getFormattedDate()}</p>
          <p className="text-2xl font-bold">{getFormattedTime()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Session */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={18} /> Current Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-bold">CS 101</h2>
            <p className="text-sm text-muted-foreground">Introduction to Programming</p>
            <div className="flex justify-between items-center mt-2">
              <Button size="sm" variant="outline" className="gap-1">
                <Clock size={16} /> Schedule
              </Button>
              <div className="flex items-center gap-1 text-sm">
                <Clock size={16} className="text-blue-500" />
                <span className="font-semibold">11:30 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Present Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={18} /> Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-bold">{statistics.present}</h2>
              <p className="text-muted-foreground pb-1">out of {statistics.total} students</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${presentPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Time Remaining */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={18} /> Time Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-3xl font-bold">{calculateTimeRemaining()}</h2>
            <p className="text-sm text-muted-foreground">Session ends at {sessionEndsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className="bg-amber-500 h-2.5 rounded-full" 
                style={{ width: `${((sessionEndsAt.getTime() - currentTime.getTime()) / (60 * 60 * 1000)) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Real-time Student Proximity</CardTitle>
              <CardDescription>Visualize student locations relative to your beacon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center relative">
                {/* This would be replaced with an actual mapping visualization */}
                <div className="w-64 h-64 rounded-full border border-dashed border-slate-300 flex items-center justify-center relative">
                  <div className="w-40 h-40 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-slate-300 flex items-center justify-center">
                      <div className="text-xs text-center">
                        <div>{proximityRadius}m</div>
                        <div>zone</div>
                      </div>
                    </div>
                    
                    {/* Simulated student positions */}
                    <div className="absolute w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold -translate-x-10 -translate-y-5">G</div>
                    <div className="absolute w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold translate-x-16 translate-y-2">A</div>
                    <div className="absolute w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold translate-x-5 translate-y-12">C</div>
                    <div className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold -translate-x-8 translate-y-8">F</div>
                    <div className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold -translate-x-4 -translate-y-14">R</div>
                  </div>
                  <div className="absolute w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold -left-2 -top-4">H</div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                  <div className="text-sm font-semibold mb-2">Status:</div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Present</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Late/In Range</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Out of Range</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All Students</TabsTrigger>
                  <TabsTrigger value="present">Present</TabsTrigger>
                  <TabsTrigger value="absent">Absent</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_STUDENTS.map(student => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full">View All Students</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Beacon Controller</CardTitle>
              <CardDescription>Control your location beacon for student attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Status</div>
                <div className="flex items-center gap-2">
                  <span className={isBeaconActive ? "text-green-500" : "text-gray-400"}>
                    {isBeaconActive ? "On" : "Off"}
                  </span>
                  <Switch 
                    checked={isBeaconActive} 
                    onCheckedChange={setIsBeaconActive} 
                  />
                </div>
              </div>

              {!isBeaconActive && (
                <div className="text-center py-6">
                  <Radio className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Beacon is offline</p>
                  <Button 
                    variant="default" 
                    className="w-full mt-4"
                    onClick={() => setIsBeaconActive(true)}
                  >
                    Activate Beacon
                  </Button>
                </div>
              )}

              {isBeaconActive && (
                <>
                  <div className="space-y-4 mb-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Range: {proximityRadius} meters</span>
                        <span className="text-sm text-muted-foreground">Medium Radius</span>
                      </div>
                      <Slider 
                        value={[proximityRadius]} 
                        min={5} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => setProximityRadius(value[0])} 
                        className="w-full" 
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <Badge variant="outline" className="w-full justify-center py-1 gap-1">
                      <Users size={14} />
                      <span>Connected Students: {statistics.present + statistics.late}</span>
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                    >
                      <Scan size={16} /> Scan for Students
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                    >
                      <Settings size={16} /> Advanced Settings
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Present */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#e6e6e6"
                    strokeWidth="15"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="15"
                    strokeDasharray={`${presentPercentage * 2.51} ${(100 - presentPercentage) * 2.51}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Late */}
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke="#e6e6e6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={`${latePercentage * 1.88} ${(100 - latePercentage) * 1.88}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Absent */}
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="transparent"
                    stroke="#e6e6e6"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={`${absentPercentage * 1.26} ${(100 - absentPercentage) * 1.26}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{presentPercentage}%</span>
                  <span className="text-xs text-green-500">Present</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Present</span>
                  </div>
                  <span className="font-semibold">{statistics.present} ({presentPercentage}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Late</span>
                  </div>
                  <span className="font-semibold">{statistics.late} ({latePercentage}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Absent</span>
                  </div>
                  <span className="font-semibold">{statistics.absent} ({absentPercentage}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AttendanceSystem; 