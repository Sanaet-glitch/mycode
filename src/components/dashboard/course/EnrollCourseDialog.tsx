
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const EnrollCourseDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: async (key: string) => {
      // First, find the course with the given enrollment key
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('enrollment_key', key)
        .single();

      if (courseError) {
        throw new Error('Invalid enrollment key');
      }

      // Then create the enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert([
          {
            course_id: course.id,
            student_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select('id')
        .single();

      if (enrollmentError) {
        if (enrollmentError.code === '23505') { // Unique violation
          throw new Error('You are already enrolled in this course');
        }
        throw enrollmentError;
      }

      return course;
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] });
      toast({
        title: "Enrolled Successfully",
        description: `You have been enrolled in ${course.title}`,
      });
      onOpenChange(false);
      setEnrollmentKey("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: error.message,
      });
    },
  });

  const handleEnroll = () => {
    if (!enrollmentKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an enrollment key",
      });
      return;
    }

    enrollMutation.mutate(enrollmentKey);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a Course</DialogTitle>
          <DialogDescription>
            Enter the enrollment key provided by your lecturer to join a course.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Enrollment Key</Label>
            <Input
              placeholder="Enter enrollment key"
              value={enrollmentKey}
              onChange={(e) => setEnrollmentKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleEnroll}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
