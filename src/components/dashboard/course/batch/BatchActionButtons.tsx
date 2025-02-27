import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, Tags, Copy } from "lucide-react";
import { useCourseManagement } from "@/hooks/use-course-management";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BatchActionButtonsProps {
  selectedCourses: string[];
  onComplete: () => void;
}

export const BatchActionButtons = ({
  selectedCourses,
  onComplete,
}: BatchActionButtonsProps) => {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { useArchiveCourse } = useCourseManagement();
  const archiveCourse = useArchiveCourse();

  const handleArchive = async () => {
    try {
      await Promise.all(
        selectedCourses.map(courseId =>
          archiveCourse.mutateAsync({ courseId })
        )
      );
      onComplete();
    } catch (error) {
      console.error('Failed to archive courses:', error);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        onClick={() => setShowArchiveDialog(true)}
        disabled={selectedCourses.length === 0}
      >
        <Archive className="mr-2 h-4 w-4" />
        Archive Selected
      </Button>
      <Button
        variant="outline"
        disabled={selectedCourses.length === 0}
      >
        <Tags className="mr-2 h-4 w-4" />
        Manage Tags
      </Button>
      <Button
        variant="outline"
        disabled={selectedCourses.length === 0}
      >
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </Button>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Selected Courses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive {selectedCourses.length} selected courses. Archived courses can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 