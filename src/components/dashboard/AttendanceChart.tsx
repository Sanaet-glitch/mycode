import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, BarChart4, PieChart, Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/utils/export";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from "date-fns";

interface AttendanceChartProps {
  courseId?: string;
  userId?: string;
  variant?: "student" | "lecturer";
}

export const AttendanceChart = ({ courseId, userId, variant = "student" }: AttendanceChartProps) => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "semester">("month");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(courseId || null);
  const [filterStatus, setFilterStatus] = useState<Array<"present" | "absent" | "late">>(["present", "absent", "late"]);
  const { toast } = useToast();

  // Get list of courses for filtering (for lecturer view or student specific view)
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["user-courses", variant, userId],
    queryFn: async () => {
      if (variant === "lecturer") {
        // Get courses taught by lecturer
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, code")
          .eq("lecturer_id", userId || (await supabase.auth.getUser()).data.user?.id);
          
        if (error) throw error;
        return data;
      } else {
        // Get courses enrolled by student
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", userId || (await supabase.auth.getUser()).data.user?.id);
          
        const courseIds = enrollments?.map(e => e.course_id) || [];
        
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, code")
          .in("id", courseIds);
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      // Set first course as default if not specified
      if (!selectedCourse && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
    }
  });

  // Get attendance records based on filters
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["attendance-data", variant, userId, selectedCourse, timeRange],
    queryFn: async () => {
      const today = new Date();
      let startDate;
      
      // Calculate date range based on selected time range
      switch (timeRange) {
        case "week":
          startDate = subDays(today, 7);
          break;
        case "month":
          startDate = startOfMonth(today);
          break;
        case "semester":
          startDate = subDays(today, 120); // Approximately 4 months
          break;
        default:
          startDate = startOfMonth(today);
      }
      
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(today, "yyyy-MM-dd");
      
      if (variant === "lecturer" && selectedCourse) {
        // Get attendance for all students in the course for lecturer view
        const { data: sessions } = await supabase
          .from("class_sessions")
          .select(`
            id,
            class_id,
            session_date,
            classes (
              id,
              name,
              course_id
            )
          `)
          .eq("classes.course_id", selectedCourse)
          .gte("session_date", formattedStartDate)
          .lte("session_date", formattedEndDate);
          
        const sessionIds = sessions?.filter(s => s.classes?.course_id === selectedCourse).map(s => s.id) || [];
        
        if (sessionIds.length === 0) {
          return { sessions: [], records: [] };
        }
        
        // Get attendance records for these sessions
        const { data: records, error } = await supabase
          .from("attendance")
          .select(`
            id,
            student_id,
            session_id,
            status,
            verification_time,
            method,
            students (
              id,
              first_name,
              last_name,
              avatar_url
            ),
            class_sessions (
              id,
              session_date,
              class_id,
              classes (
                id,
                name
              )
            )
          `)
          .in("session_id", sessionIds);
          
        if (error) throw error;
        
        return { sessions, records: records || [] };
      } else {
        // Get individual student attendance
        const { data: records, error } = await supabase
          .from("attendance")
          .select(`
            id,
            student_id,
            session_id,
            status,
            verification_time,
            method,
            class_sessions (
              id,
              session_date,
              class_id,
              classes (
                id,
                name,
                course:courses (
                  id,
                  title,
                  code
                )
              )
            )
          `)
          .eq("student_id", userId || (await supabase.auth.getUser()).data.user?.id)
          .gte("class_sessions.session_date", formattedStartDate)
          .lte("class_sessions.session_date", formattedEndDate);
          
        if (error) throw error;
        
        // Filter by selected course if specified
        const filteredRecords = selectedCourse 
          ? records?.filter(r => r.class_sessions?.classes?.course?.id === selectedCourse)
          : records;
          
        return { records: filteredRecords || [] };
      }
    },
    enabled: (!!selectedCourse || variant === "student") && !!courses?.length
  });

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    if (!attendanceData?.records || attendanceData.records.length === 0) {
      return {
        total: 0,
        present: 0, 
        absent: 0,
        late: 0,
        rate: 0,
        byClass: [],
        byDate: []
      };
    }
    
    const records = attendanceData.records;
    
    // Count by status
    const byStatus = {
      present: records.filter(r => r.status === "present").length,
      absent: records.filter(r => r.status === "absent").length,
      late: records.filter(r => r.status === "late").length
    };
    
    const total = byStatus.present + byStatus.absent + byStatus.late;
    const attendanceRate = total > 0 ? Math.round((byStatus.present / total) * 100) : 0;
    
    // Count by class
    const byClass = [];
    if (variant === "student") {
      const classes = {};
      
      records.forEach(record => {
        const className = record.class_sessions?.classes?.name || "Unknown";
        if (!classes[className]) {
          classes[className] = { name: className, present: 0, absent: 0, late: 0, total: 0 };
        }
        
        classes[className][record.status]++;
        classes[className].total++;
      });
      
      Object.values(classes).forEach((classData: any) => {
        const rate = classData.total > 0 ? Math.round((classData.present / classData.total) * 100) : 0;
        byClass.push({ ...classData, rate });
      });
    }
    
    // Count by date
    const byDate = [];
    if (timeRange === "month") {
      const today = new Date();
      const dates = eachDayOfInterval({
        start: startOfMonth(today),
        end: today
      });
      
      dates.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayRecords = records.filter(r => {
          const recordDate = r.class_sessions?.session_date;
          return recordDate && format(parseISO(recordDate), "yyyy-MM-dd") === dateStr;
        });
        
        const presentCount = dayRecords.filter(r => r.status === "present").length;
        const absentCount = dayRecords.filter(r => r.status === "absent").length;
        const lateCount = dayRecords.filter(r => r.status === "late").length;
        
        byDate.push({
          date: dateStr,
          displayDate: format(date, "MMM d"),
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          total: presentCount + absentCount + lateCount
        });
      });
    }
    
    return {
      total,
      present: byStatus.present,
      absent: byStatus.absent,
      late: byStatus.late,
      rate: attendanceRate,
      byClass,
      byDate
    };
  };

  const stats = getAttendanceStats();

  // Generate data for export
  const handleExport = () => {
    const records = attendanceData?.records || [];
    
    // Format data for export
    const exportData = records.map(record => ({
      Class: record.class_sessions?.classes?.name || "Unknown",
      Course: record.class_sessions?.classes?.course?.title || "Unknown",
      Date: record.class_sessions?.session_date 
        ? format(parseISO(record.class_sessions.session_date), "yyyy-MM-dd")
        : "Unknown",
      Status: record.status,
      Method: record.method,
      Time: record.verification_time 
        ? format(parseISO(record.verification_time), "h:mm a")
        : "Unknown"
    }));
    
    if (exportData.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no attendance records matching your filters."
      });
      return;
    }
    
    exportToCSV(exportData);
    
    toast({
      title: "Export Complete",
      description: `Exported ${exportData.length} attendance records.`
    });
  };

  // Handle filter status changes
  const toggleStatusFilter = (status: "present" | "absent" | "late") => {
    setFilterStatus(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Display loading state if data is being fetched
  if (isLoadingCourses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
          <CardDescription>Loading your attendance data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Display empty state if no courses available
  if (!courses?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
          <CardDescription>No course data available</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          {variant === "student" 
            ? "You are not enrolled in any courses. Enroll in courses to see attendance analytics."
            : "You don't have any courses. Create courses to see attendance analytics."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle>Attendance Analytics</CardTitle>
            <CardDescription>
              {variant === "student" 
                ? "Your class attendance records and statistics"
                : "Student attendance records and statistics"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  <span>Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-4" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Status</h4>
                  <div className="space-y-2">
                    {(["present", "absent", "late"] as const).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`filter-${status}`} 
                          checked={filterStatus.includes(status)}
                          onCheckedChange={() => toggleStatusFilter(status)}
                        />
                        <Label htmlFor={`filter-${status}`} className="capitalize">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <Select
              value={selectedCourse || ""}
              onValueChange={(value) => setSelectedCourse(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code}: {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Button
                variant={timeRange === "week" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTimeRange("week")}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTimeRange("month")}
              >
                Month
              </Button>
              <Button
                variant={timeRange === "semester" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setTimeRange("semester")}
              >
                Semester
              </Button>
            </div>
          </div>

          {isLoadingAttendance ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !attendanceData || attendanceData.records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>No attendance records found for the selected filters.</p>
              <p className="text-sm mt-1">Try selecting a different course or time range.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Classes</div>
                  <div className="text-2xl font-bold mt-1">{stats.total}</div>
                </div>
                <div className="bg-green-100 dark:bg-green-950/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Present</div>
                  <div className="text-2xl font-bold mt-1">{stats.present}</div>
                </div>
                <div className="bg-amber-100 dark:bg-amber-950/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Late</div>
                  <div className="text-2xl font-bold mt-1">{stats.late}</div>
                </div>
                <div className="bg-red-100 dark:bg-red-950/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-muted-foreground">Absent</div>
                  <div className="text-2xl font-bold mt-1">{stats.absent}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 pt-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Attendance Rate</h3>
                  <p className="text-sm text-muted-foreground">Summary of your attendance performance</p>
                </div>
                <div className="flex items-center">
                  <Badge variant={stats.rate >= 75 ? "success" : stats.rate >= 60 ? "warning" : "destructive"}>
                    {stats.rate}%
                  </Badge>
                </div>
              </div>

              {/* Visualization */}
              <Tabs defaultValue="chart">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="chart">
                      <BarChart4 className="h-4 w-4 mr-2" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger value="records">
                      <Calendar className="h-4 w-4 mr-2" />
                      Records
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="chart" className="space-y-4">
                  {timeRange === "month" && stats.byDate.length > 0 ? (
                    <div className="h-60 mt-4">
                      <div className="font-medium mb-4">Daily Attendance (This Month)</div>
                      <div className="h-[200px] flex items-end">
                        {stats.byDate.map((day) => (
                          <div key={day.date} className="flex-1 flex flex-col items-center group">
                            <div className="text-xs text-muted-foreground mb-1">
                              {day.total > 0 ? 
                                `${Math.round((day.present / day.total) * 100)}%` : 
                                '-'}
                            </div>
                            <div className="w-full px-1 flex space-x-0.5">
                              {day.present > 0 && (
                                <div 
                                  className="bg-green-500 dark:bg-green-600 rounded-t"
                                  style={{ 
                                    height: `${(day.present / Math.max(...stats.byDate.map(d => d.total || 1))) * 150}px`,
                                    width: day.total > 1 ? '33%' : '100%'
                                  }}
                                ></div>
                              )}
                              {day.late > 0 && (
                                <div 
                                  className="bg-amber-500 dark:bg-amber-600 rounded-t"
                                  style={{ 
                                    height: `${(day.late / Math.max(...stats.byDate.map(d => d.total || 1))) * 150}px`,
                                    width: day.total > 1 ? '33%' : '100%'
                                  }}
                                ></div>
                              )}
                              {day.absent > 0 && (
                                <div 
                                  className="bg-red-500 dark:bg-red-600 rounded-t"
                                  style={{ 
                                    height: `${(day.absent / Math.max(...stats.byDate.map(d => d.total || 1))) * 150}px`,
                                    width: day.total > 1 ? '33%' : '100%'
                                  }}
                                ></div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-center">
                              {day.displayDate}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center">
                        <div className="relative w-32 h-32">
                          <div className="w-32 h-32 rounded-full border-8 border-secondary"></div>
                          {stats.present > 0 && (
                            <div 
                              className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500"
                              style={{ 
                                transform: `rotate(${Math.min(stats.present / stats.total * 360, 180)}deg)`,
                                display: stats.present >= stats.total / 2 ? 'block' : 'none'
                              }}
                            ></div>
                          )}
                          {stats.present > 0 && stats.present >= stats.total / 2 && (
                            <div 
                              className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent border-b-green-500 border-l-green-500"
                              style={{ 
                                transform: `rotate(${Math.min((stats.present / stats.total - 0.5) * 360, 180)}deg)`,
                                display: stats.present > stats.total / 2 ? 'block' : 'none'
                              }}
                            ></div>
                          )}
                          {stats.present > 0 && stats.present < stats.total / 2 && (
                            <div 
                              className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500"
                              style={{ 
                                transform: `rotate(${Math.min(stats.present / stats.total * 360, 180)}deg)`
                              }}
                            ></div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold">{stats.rate}%</div>
                              <div className="text-xs text-muted-foreground">Attendance</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="sm:ml-8 mt-6 sm:mt-0 flex flex-col sm:justify-center space-y-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">Present: {stats.present}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                            <span className="text-sm">Late: {stats.late}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <span className="text-sm">Absent: {stats.absent}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Class breakdown for student view */}
                  {variant === "student" && stats.byClass.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Attendance by Class</h3>
                      <div className="space-y-3">
                        {stats.byClass.map((cls) => (
                          <div key={cls.name} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{cls.name}</div>
                              <Badge variant={cls.rate >= 75 ? "success" : cls.rate >= 60 ? "warning" : "destructive"}>
                                {cls.rate}%
                              </Badge>
                            </div>
                            <div className="mt-2 bg-secondary/30 w-full h-2 rounded-full overflow-hidden">
                              {cls.total > 0 && (
                                <div 
                                  className="bg-primary h-full"
                                  style={{ width: `${cls.rate}%` }}
                                ></div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground flex space-x-3">
                              <span>Present: {cls.present}</span>
                              <span>Late: {cls.late}</span>
                              <span>Absent: {cls.absent}</span>
                              <span>Total: {cls.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="records">
                  <div className="border rounded-lg divide-y">
                    {attendanceData.records
                      .filter(record => filterStatus.includes(record.status as any))
                      .map(record => (
                        <div key={record.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between">
                          <div>
                            <div className="font-medium">{record.class_sessions?.classes?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.class_sessions?.session_date && 
                                format(parseISO(record.class_sessions.session_date), "EEEE, MMMM d, yyyy")}
                            </div>
                          </div>
                          <div className="flex items-center mt-2 sm:mt-0">
                            <Badge 
                              variant={
                                record.status === "present" ? "success" : 
                                record.status === "late" ? "warning" : 
                                "destructive"
                              }
                              className="capitalize mr-2"
                            >
                              {record.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {record.verification_time && 
                                format(parseISO(record.verification_time), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      ))}

                    {attendanceData.records
                      .filter(record => filterStatus.includes(record.status as any))
                      .length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        No records match your selected filters.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};