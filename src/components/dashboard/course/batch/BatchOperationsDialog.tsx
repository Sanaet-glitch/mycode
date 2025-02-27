import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CourseSelectionTable } from "./CourseSelectionTable";
import { BatchActionButtons } from "./BatchActionButtons";

interface BatchOperationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BatchOperationsDialog = ({
  isOpen,
  onOpenChange,
}: BatchOperationsDialogProps) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Batch Course Operations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <CourseSelectionTable
            selectedCourses={selectedCourses}
            onSelectionChange={setSelectedCourses}
          />
          <BatchActionButtons
            selectedCourses={selectedCourses}
            onComplete={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 