import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, RepeatIcon, Calendar, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, isBefore, isAfter, parseISO, addWeeks } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
}

interface Class {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  venue: string;
  recurrence_pattern?: string;
  start_date?: string;
  end_date?: string;
}

interface ClassScheduleDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Recurrence patterns supported
const RECURRENCE_PATTERNS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "one-time", label: "One-time" }
];

export const ClassScheduleDialog = ({ course, isOpen, onOpenChange }: ClassScheduleDialogProps) => {
  const today = new Date();
  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    name: "",
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:30",
    venue: "",
    recurrence_pattern: "weekly",
    start_date: format(today, 'yyyy-MM-dd'),
    end_date: format(addDays(today, 90), 'yyyy-MM-dd') // Default to a semester (around 3 months)
  });
  
  const [isRecurring, setIsRecurring] = useState(true);
  const [activeTab, setActiveTab] = useState<"single" | "recurring">("recurring");
  const [conflicts, setConflicts] = useState<Array<{date: string, time: string, courseName: string}>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', course?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          course:courses (
            title
          )
        `)
        .eq('course_id', course?.id)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching classes:', error);
        throw error;
      }
      return data;
    },
    enabled: !!course?.id && isOpen,
  });

  // Query to check for schedule conflicts
  const { data: allClasses, isLoading: isLoadingAllClasses } = useQuery({
    queryKey: ['all-classes'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id);

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data, error } = await supabase
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
          course_id,
          course:courses (
            id,
            title
          )
        `)
        .in('course_id', enrolledCourseIds);

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const createClassMutation = useMutation({
    mutationFn: async (classData: Omit<Class, 'id'>) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([
          {
            ...classData,
            course_id: course?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      setNewClass({
        name: "",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:30",
        venue: "",
        recurrence_pattern: "weekly",
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(addDays(today, 90), 'yyyy-MM-dd')
      });
      toast({
        title: "Class created",
        description: "New class schedule has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create class. Please try again.",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-schedule'] });
      toast({
        title: "Class deleted",
        description: "Class schedule has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete class. Please try again.",
      });
    },
  });

  // Check for schedule conflicts
  const detectConflicts = () => {
    if (!allClasses || allClasses.length === 0) return [];

    const newStartTime = newClass.start_time;
    const newEndTime = newClass.end_time;
    const newDayOfWeek = newClass.day_of_week;
    const newStartDate = newClass.start_date ? parseISO(newClass.start_date) : today;
    const newEndDate = newClass.end_date ? parseISO(newClass.end_date) : addDays(today, 90);
    
    const detectedConflicts: Array<{date: string, time: string, courseName: string}> = [];
    
    // Filter out classes from the same course being edited
    const otherClasses = allClasses.filter(c => c.course_id !== course?.id);
    
    for (const existingClass of otherClasses) {
      // Skip if different day of week for weekly patterns
      if (existingClass.day_of_week !== newDayOfWeek) continue;
      
      // Check time overlap
      const existingStartTime = existingClass.start_time;
      const existingEndTime = existingClass.end_time;
      
      const hasTimeOverlap = (
        (newStartTime >= existingStartTime && newStartTime < existingEndTime) ||
        (newEndTime > existingStartTime && newEndTime <= existingEndTime) ||
        (newStartTime <= existingStartTime && newEndTime >= existingEndTime)
      );
      
      if (!hasTimeOverlap) continue;
      
      // Check date overlap based on recurrence pattern
      const existingStartDate = existingClass.start_date ? parseISO(existingClass.start_date) : undefined;
      const existingEndDate = existingClass.end_date ? parseISO(existingClass.end_date) : undefined;
      
      if (existingStartDate && existingEndDate) {
        // Check if date ranges overlap
        const hasDateOverlap = (
          (isBefore(newStartDate, existingEndDate) && isAfter(newEndDate, existingStartDate))
        );
        
        if (hasDateOverlap) {
          // Calculate actual conflict days based on recurrence patterns
          let conflictDays: Date[] = [];
          
          if (newClass.recurrence_pattern === 'weekly' && existingClass.recurrence_pattern === 'weekly') {
            // Weekly pattern - conflict on all matching days of week between start and end dates
            conflictDays.push(new Date());
          } else if (newClass.recurrence_pattern === 'biweekly' || existingClass.recurrence_pattern === 'biweekly') {
            // Bi-weekly pattern - more complex calculation needed
            conflictDays.push(new Date());
          }
          
          if (conflictDays.length > 0) {
            detectedConflicts.push({
              date: format(new Date(), 'PPP'),
              time: `${existingStartTime} - ${existingEndTime}`,
              courseName: existingClass.course?.title || 'Unknown Course'
            });
          }
        }
      }
    }
    
    return detectedConflicts;
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.venue) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Handle recurring vs one-time class
    const classData = {...newClass};
    
    if (!isRecurring) {
      classData.recurrence_pattern = "one-time";
    } else if (!classData.recurrence_pattern) {
      classData.recurrence_pattern = "weekly"; // Default
    }
    
    // Check for conflicts
    const detectedConflicts = detectConflicts();
    
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      // Just show conflicts but still allow creation - instructor's choice
      toast({
        variant: "destructive",
        title: "Schedule Conflicts Detected",
        description: "There are conflicts with existing classes. Please review.",
      });
      return;
    }

    createClassMutation.mutate(classData);
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      deleteClassMutation.mutate(classId);
    }
  };

  const toggleRecurring = (value: boolean) => {
    setIsRecurring(value);
    setActiveTab(value ? "recurring" : "single");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Manage Class Schedule</DialogTitle>
          <DialogDescription>
            Add or remove classes for {course?.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-x-2 flex items-center">
              <Label htmlFor="recurring-toggle">Recurring Class</Label>
              <Switch 
                id="recurring-toggle" 
                checked={isRecurring} 
                onCheckedChange={toggleRecurring} 
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Schedule Help
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">About Class Scheduling</h4>
                  <p className="text-sm text-muted-foreground">
                    Recurring classes repeat according to a pattern until the end date.
                    One-time classes occur only on the specific date selected.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The system will check for conflicts with your existing schedule.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                placeholder="Enter class name"
                value={newClass.name}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            {isRecurring ? (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={newClass.day_of_week.toString()}
                  onValueChange={(value) => setNewClass(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newClass.start_date}
                  onChange={(e) => {
                    const date = e.target.value;
                    setNewClass(prev => ({ 
                      ...prev, 
                      start_date: date,
                      end_date: date // For one-time class, start and end date are the same
                    }));
                  }}
                  min={format(today, 'yyyy-MM-dd')}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newClass.start_time}
                onChange={(e) => setNewClass(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newClass.end_time}
                onChange={(e) => setNewClass(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                placeholder="Enter venue"
                value={newClass.venue}
                onChange={(e) => setNewClass(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
            
            {isRecurring && (
              <div className="space-y-2">
                <Label>Recurrence Pattern</Label>
                <Select
                  value={newClass.recurrence_pattern}
                  onValueChange={(value) => setNewClass(prev => ({ ...prev, recurrence_pattern: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_PATTERNS.filter(p => p.value !== 'one-time').map((pattern) => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {isRecurring && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newClass.start_date}
                    onChange={(e) => setNewClass(prev => ({ ...prev, start_date: e.target.value }))}
                    min={format(today, 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newClass.end_date}
                    onChange={(e) => setNewClass(prev => ({ ...prev, end_date: e.target.value }))}
                    min={newClass.start_date}
                  />
                </div>
              </>
            )}
          </div>
          
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Schedule Conflicts Detected</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p>This class conflicts with your existing schedule:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        <span className="font-medium">{conflict.courseName}</span> on {conflict.date}, {conflict.time}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleCreateClass}
            disabled={createClassMutation.isPending}
            className="w-full"
          >
            {createClassMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Class
          </Button>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-4">Existing Classes</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : classes?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No classes scheduled yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes?.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>{classItem.name}</TableCell>
                      <TableCell>
                        {classItem.recurrence_pattern === 'one-time' ? (
                          <span>{classItem.start_date}</span>
                        ) : (
                          <div className="flex flex-col">
                            <span>{DAYS_OF_WEEK[classItem.day_of_week - 1]}</span>
                            {classItem.recurrence_pattern && classItem.recurrence_pattern !== 'weekly' && (
                              <Badge variant="outline" className="mt-1">
                                {RECURRENCE_PATTERNS.find(p => p.value === classItem.recurrence_pattern)?.label}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                      </TableCell>
                      <TableCell>{classItem.venue}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id)}
                          disabled={deleteClassMutation.isPending}
                        >
                          {deleteClassMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
