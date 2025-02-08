
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
}

interface ClassScheduleDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

export const ClassScheduleDialog = ({ course, isOpen, onOpenChange }: ClassScheduleDialogProps) => {
  const [newClass, setNewClass] = useState<Omit<Class, 'id'>>({
    name: "",
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:30",
    venue: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes', course?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
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
      setNewClass({
        name: "",
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:30",
        venue: ""
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

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.venue) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    createClassMutation.mutate(newClass);
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      deleteClassMutation.mutate(classId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Manage Class Schedule</DialogTitle>
          <DialogDescription>
            Add or remove classes for {course?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input
                placeholder="Enter class name"
                value={newClass.name}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
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
            <div className="col-span-2 space-y-2">
              <Label>Venue</Label>
              <Input
                placeholder="Enter venue"
                value={newClass.venue}
                onChange={(e) => setNewClass(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
          </div>
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
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes?.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>{classItem.name}</TableCell>
                      <TableCell>{DAYS_OF_WEEK[classItem.day_of_week - 1]}</TableCell>
                      <TableCell>
                        {classItem.start_time} - {classItem.end_time}
                      </TableCell>
                      <TableCell>{classItem.venue}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id)}
                        >
                          Delete
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
