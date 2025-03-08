import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Bell, BellOff, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isToday, isPast, isFuture, parseISO, isSameDay, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

interface ClassScheduleProps {
  compact?: boolean;
  showControls?: boolean;
  onlyToday?: boolean;
}

export const ClassSchedule = ({ compact = false, showControls = true, onlyToday = false }: ClassScheduleProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState(onlyToday ? "today" : "week");
  const { toast } = useToast();
  
  // Check if notifications are supported and permission is granted
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Query to get enrolled classes
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['class-schedule'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          day_of_week,
          start_time,
          end_time,
          venue,
          recurrence_pattern,
          start_date,
          end_date,
          course:courses (
            id,
            title
          )
        `)
        .in('course_id', enrolledCourseIds)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return classes;
    },
  });

  // Mutation to save notification preferences
  const notificationPreferenceMutation = useMutation({
    mutationFn: async ({ classId, enabled }: { classId: string, enabled: boolean }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          class_id: classId,
          enabled,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Notification preference saved",
        description: "Your notification settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
      });
    }
  });

  // Handler for requesting notification permissions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Notifications are not supported in your browser.",
      });
      return;
    }
    
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications for upcoming classes.",
        });
        
        // Show a test notification
        new Notification("Campus Connect", {
          body: "Class notifications are now enabled!",
          icon: "/favicon.ico"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
      });
    }
  };

  // Toggle notification for a specific class
  const toggleClassNotification = (classId: string, enabled: boolean) => {
    if (!notificationsEnabled) {
      requestNotificationPermission();
      return;
    }
    
    notificationPreferenceMutation.mutate({ classId, enabled });
  };

  // Set up notifications for upcoming classes
  useEffect(() => {
    if (!notificationsEnabled || !schedule) return;
    
    // Clear any existing notification timers
    const timers: NodeJS.Timeout[] = [];
    
    // Helper function to calculate the next occurrence of a class
    const getNextOccurrence = (classItem: any) => {
      const today = new Date();
      const currentDayOfWeek = (today.getDay() + 6) % 7 + 1; // Convert to 1-7 (Mon-Sun)
      
      // Get the time of the class
      const [hours, minutes] = classItem.start_time.split(':').map(Number);
      
      // One-time class
      if (classItem.recurrence_pattern === 'one-time') {
        const classDate = parseISO(classItem.start_date);
        classDate.setHours(hours, minutes, 0, 0);
        return isFuture(classDate) ? classDate : null;
      }
      
      // Recurring weekly class
      if (classItem.recurrence_pattern === 'weekly' || !classItem.recurrence_pattern) {
        let daysToAdd = 0;
        
        if (classItem.day_of_week > currentDayOfWeek) {
          // Class is later this week
          daysToAdd = classItem.day_of_week - currentDayOfWeek;
        } else if (classItem.day_of_week === currentDayOfWeek) {
          // Class is today, check if it's in the future
          const classTime = new Date();
          classTime.setHours(hours, minutes, 0, 0);
          
          if (isFuture(classTime)) {
            daysToAdd = 0;
          } else {
            // Class already passed today, get next week
            daysToAdd = 7;
          }
        } else {
          // Class is next week
          daysToAdd = 7 - (currentDayOfWeek - classItem.day_of_week);
        }
        
        const nextDate = addDays(today, daysToAdd);
        nextDate.setHours(hours, minutes, 0, 0);
        
        // Check if the next occurrence is within the class date range
        if (classItem.start_date && classItem.end_date) {
          const startDate = parseISO(classItem.start_date);
          const endDate = parseISO(classItem.end_date);
          
          if (nextDate < startDate || nextDate > endDate) {
            return null;
          }
        }
        
        return nextDate;
      }
      
      // Bi-weekly or monthly patterns would require more complex calculations
      return null;
    };
    
    // Schedule notifications for each class
    schedule.forEach(classItem => {
      const nextOccurrence = getNextOccurrence(classItem);
      
      if (nextOccurrence) {
        // Calculate time until class (in minutes)
        const minutesUntilClass = differenceInMinutes(nextOccurrence, new Date());
        
        // Notifications at: 1 day before, 1 hour before, and 15 minutes before
        const notificationTimes = [
          { minutes: 24 * 60, label: '24 hours' },
          { minutes: 60, label: '1 hour' },
          { minutes: 15, label: '15 minutes' }
        ];
        
        notificationTimes.forEach(({ minutes, label }) => {
          if (minutesUntilClass > minutes) {
            const timeToNotify = minutesUntilClass - minutes;
            
            const timer = setTimeout(() => {
              new Notification(`Upcoming Class: ${classItem.name}`, {
                body: `${classItem.course.title} starts in ${label} (${format(nextOccurrence, 'h:mm a')} at ${classItem.venue})`,
                icon: "/favicon.ico"
              });
            }, timeToNotify * 60 * 1000);
            
            timers.push(timer);
          }
        });
      }
    });
    
    // Cleanup function to clear timers
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notificationsEnabled, schedule]);

  // Filter classes for today
  const todayClasses = schedule?.filter(classItem => {
    const today = new Date();
    const currentDayOfWeek = (today.getDay() + 6) % 7 + 1; // Convert to 1-7 (Mon-Sun)
    
    if (classItem.recurrence_pattern === 'one-time') {
      // One-time class
      return isSameDay(parseISO(classItem.start_date), today);
    } else if (classItem.recurrence_pattern === 'weekly' || !classItem.recurrence_pattern) {
      // Weekly class
      if (classItem.day_of_week !== currentDayOfWeek) return false;
      
      // Check if today is within date range
      if (classItem.start_date && classItem.end_date) {
        const startDate = parseISO(classItem.start_date);
        const endDate = parseISO(classItem.end_date);
        return !isBefore(today, startDate) && !isAfter(today, endDate);
      }
      
      return true;
    } else if (classItem.recurrence_pattern === 'biweekly') {
      // Implement bi-weekly pattern check
      return false;
    }
    
    return false;
  });

  // Determine if a class is in progress, upcoming, or completed for today
  const getClassStatus = (classItem: any) => {
    if (!isToday(new Date())) return 'upcoming';
    
    const now = new Date();
    const [startHours, startMinutes] = classItem.start_time.split(':').map(Number);
    const [endHours, endMinutes] = classItem.end_time.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'completed';
    return 'in-progress';
  };

  // Render a simplified version for the compact mode (e.g., for Today's Classes widget)
  if (compact) {
    return (
      <div className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 py-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[220px]" />
              </div>
            </div>
          ))
        ) : !todayClasses?.length ? (
          <div className="text-center py-2 text-muted-foreground">
            No classes scheduled for today.
          </div>
        ) : (
          todayClasses.map((classItem) => {
            const status = getClassStatus(classItem);
            
            return (
              <div key={classItem.id} className="flex items-center space-x-3 py-2 border-b last:border-0">
                <div className="flex-none">
                  <div className={`p-3 rounded-full text-center ${
                    status === 'in-progress' ? 'bg-green-100 dark:bg-green-900/20' :
                    status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Clock className={`h-5 w-5 ${
                      status === 'in-progress' ? 'text-green-600 dark:text-green-400' :
                      status === 'upcoming' ? 'text-blue-600 dark:text-blue-400' :
                      'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{classItem.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center space-x-1">
                    <span>{classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}</span>
                    <span>•</span>
                    <span className="truncate">{classItem.venue}</span>
                  </div>
                </div>
                {status === 'upcoming' && notificationsEnabled && (
                  <Button variant="ghost" size="icon" className="flex-none" onClick={() => toggleClassNotification(classItem.id, true)}>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Class Schedule</CardTitle>
            <CardDescription>Your weekly class schedule</CardDescription>
          </div>
          {showControls && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="notifications" className="text-sm">Notifications</Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission();
                  } else {
                    setNotificationsEnabled(false);
                    toast({
                      title: "Notifications Disabled",
                      description: "You will no longer receive class notifications."
                    });
                  }
                }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showControls && !onlyToday && (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab as any} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !schedule?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No classes scheduled. Enroll in courses to see your schedule.
          </div>
        ) : activeTab === "today" || onlyToday ? (
          todayClasses?.length ? (
            <div className="space-y-3">
              {todayClasses.map((classItem) => {
                const status = getClassStatus(classItem);
                return (
                  <div key={classItem.id} className={`p-3 rounded-lg border ${
                    status === 'in-progress' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                    status === 'upcoming' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                    'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{classItem.name}</div>
                        <div className="text-sm">{classItem.course.title}</div>
                      </div>
                      <Badge variant={
                        status === 'in-progress' ? 'success' :
                        status === 'upcoming' ? 'outline' :
                        'secondary'
                      }>
                        {status === 'in-progress' ? 'In Progress' :
                         status === 'upcoming' ? 'Upcoming' :
                         'Completed'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                      </div>
                      <div>{classItem.venue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No classes scheduled for today.
            </div>
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Venue</TableHead>
                {notificationsEnabled && <TableHead>Notify</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule?.map((classItem) => {
                // For non-recurring (one-time) classes, show the date instead of day of week
                const dayDisplay = classItem.recurrence_pattern === 'one-time'
                  ? format(parseISO(classItem.start_date!), 'MMM d')
                  : DAYS_OF_WEEK[classItem.day_of_week - 1];
                
                // Add badge for recurring pattern if not weekly (which is the default)
                const showPatternBadge = classItem.recurrence_pattern && 
                                         classItem.recurrence_pattern !== 'weekly' &&
                                         classItem.recurrence_pattern !== 'one-time';
                
                return (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{dayDisplay}</span>
                        {showPatternBadge && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {classItem.recurrence_pattern === 'biweekly' ? 'Bi-weekly' : 
                             classItem.recurrence_pattern === 'monthly' ? 'Monthly' : ''}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                    </TableCell>
                    <TableCell>{classItem.course?.title}</TableCell>
                    <TableCell>{classItem.name}</TableCell>
                    <TableCell>{classItem.venue}</TableCell>
                    {notificationsEnabled && (
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleClassNotification(classItem.id, true)}
                        >
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {!notificationsEnabled && showControls && (
          <Alert className="mt-4">
            <Bell className="h-4 w-4" />
            <AlertTitle>Enable Notifications</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <p>Get reminders 15 minutes before your classes start.</p>
                <Button size="sm" onClick={requestNotificationPermission}>
                  Enable Notifications
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
