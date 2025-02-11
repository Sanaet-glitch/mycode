
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  enrollment_key: string;
}

interface EditCourseDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCourseDialog = ({ course, isOpen, onOpenChange }: EditCourseDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCourseMutation = useMutation({
    mutationFn: async (courseData: { id: string; title: string; description: string; enrollment_key: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update({
          title: courseData.title,
          description: courseData.description,
          enrollment_key: courseData.enrollment_key,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onOpenChange(false);
      toast({
        title: "Course updated",
        description: "Course details have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update course. Please try again.",
      });
    },
  });

  const handleEditCourse = async () => {
    if (!course || !course.title) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course title",
      });
      return;
    }

    updateCourseMutation.mutate({
      id: course.id,
      title: course.title,
      description: course.description || "",
      enrollment_key: course.enrollment_key,
    });
  };

  const generateNewKey = () => {
    const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
    if (course) {
      course.enrollment_key = newKey;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>Update course details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Course Title</Label>
            <Input
              placeholder="Enter course title"
              value={course?.title || ""}
              onChange={(e) => {
                if (course) {
                  course.title = e.target.value;
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Enter course description"
              value={course?.description || ""}
              onChange={(e) => {
                if (course) {
                  course.description = e.target.value;
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Enrollment Key</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter enrollment key"
                value={course?.enrollment_key || ""}
                onChange={(e) => {
                  if (course) {
                    course.enrollment_key = e.target.value;
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateNewKey}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleEditCourse}
            disabled={updateCourseMutation.isPending}
          >
            {updateCourseMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
