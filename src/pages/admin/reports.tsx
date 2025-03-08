import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  getUserStatistics, 
  getRecentLogins, 
  getActivitySummary, 
  getCourseEngagementMetrics, 
  getAttendanceStatistics 
} from "@/services/reportingService";

// Import report components
import { UserStatisticsCard } from "@/components/admin/reports/UserStatisticsCard";
import { RecentLoginsCard } from "@/components/admin/reports/RecentLoginsCard";
import { ActivityByUserTypeCard } from "@/components/admin/reports/ActivityByUserTypeCard";
import { SystemActivityCard } from "@/components/admin/reports/SystemActivityCard";
import { UserActivitySummary } from "@/components/admin/reports/UserActivitySummary";
import { CourseEngagementCard } from "@/components/admin/reports/CourseEngagementCard";
import { AttendanceStatisticsCard } from "@/components/admin/reports/AttendanceStatisticsCard";
import { ReportGenerator } from "@/components/admin/reports/ReportGenerator";

/**
 * Reports Page
 * This page displays analytics and reports for administrators
 */
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  
  // Fetch user statistics data
  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ['userStatistics', timeRange],
    queryFn: () => {
      // Convert timeRange to appropriate format for getUserStatistics
      const apiTimeRange = timeRange === "7d" ? "day" : 
                          timeRange === "30d" ? "week" : "month";
      return getUserStatistics(apiTimeRange);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch recent logins
  const { data: recentLogins, isLoading: isLoadingRecentLogins } = useQuery({
    queryKey: ['recentLogins'],
    queryFn: () => getRecentLogins(10, true),
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch activity summary
  const { data: activitySummary, isLoading: isLoadingActivitySummary } = useQuery({
    queryKey: ['activitySummary', timeRange],
    queryFn: () => {
      // Convert timeRange to days for getActivitySummary
      const days = timeRange === "7d" ? 7 : 
                  timeRange === "30d" ? 30 : 90;
      return getActivitySummary(days);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch course engagement metrics
  const { data: courseEngagement, isLoading: isLoadingCourseEngagement } = useQuery({
    queryKey: ['courseEngagement', timeRange],
    queryFn: () => getCourseEngagementMetrics(10, 'activity'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch attendance statistics
  const { data: attendanceStats, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendanceStatistics', timeRange],
    queryFn: () => {
      // Convert timeRange to appropriate format for getAttendanceStatistics
      const apiTimeRange = timeRange === "7d" ? "week" : 
                          timeRange === "30d" ? "month" : "semester";
      return getAttendanceStatistics(apiTimeRange);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
  
  /**
   * Handle time range change
   */
  const handleTimeRangeChange = (range: "7d" | "30d" | "90d") => {
    setTimeRange(range);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View and generate reports on user activity, engagement, and system performance
        </p>
      </div>
      
      {/* Time range selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center rounded-md border border-input bg-background p-1">
          <button
            onClick={() => handleTimeRangeChange("7d")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              timeRange === "7d" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange("30d")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              timeRange === "30d" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange("90d")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              timeRange === "90d" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <UserStatisticsCard 
              userStats={userStats} 
              loading={isLoadingUserStats} 
            />
            
            <ActivityByUserTypeCard 
              userStats={userStats}
              loading={isLoadingUserStats}
            />
            
            <RecentLoginsCard 
              recentLogins={recentLogins} 
              loading={isLoadingRecentLogins} 
            />
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <SystemActivityCard 
              data={activitySummary || []} 
              loading={isLoadingActivitySummary} 
            />
            
            <UserActivitySummary 
              activitySummary={activitySummary} 
              loading={isLoadingActivitySummary} 
            />
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 grid-cols-1">
            <CourseEngagementCard 
              courseData={courseEngagement || []} 
              loading={isLoadingCourseEngagement} 
            />
            
            <AttendanceStatisticsCard 
              data={attendanceStats} 
              loading={isLoadingAttendance} 
            />
          </div>
        </TabsContent>

        {/* Generate Reports Tab */}
        <TabsContent value="reports">
          <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
} 