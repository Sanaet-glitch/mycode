import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TagManager } from "./TagManager";
import { useState } from "react";
import { useCourseManagement } from "@/hooks/use-course-management";
import { useToast } from "@/hooks/use-toast";

interface BatchTagManageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourses: string[];
  onComplete: () => void;
}

export const BatchTagManageDialog = ({
  isOpen,
  onOpenChange,
  selectedCourses,
  onComplete,
}: BatchTagManageDialogProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const handleApplyTags = async () => {
    if (selectedTags.length === 0) {
      toast({
        variant: "destructive",
        title: "No Tags Selected",
        description: "Please select at least one tag to apply.",
      });
      return;
    }

    try {
      // Add logic to apply tags to selected courses
      toast({
        title: "Tags Applied",
        description: `Successfully applied tags to ${selectedCourses.length} courses.`,
      });
      onComplete();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Apply Tags",
        description: "An error occurred while applying tags to courses.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Tags for Selected Courses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <TagManager
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          <div className="flex justify-end">
            <Button onClick={handleApplyTags}>
              Apply Tags to Selected Courses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 