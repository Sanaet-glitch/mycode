
import { FileEdit, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseActionsProps {
  onEdit: () => void;
  onViewStudents: () => void;
  onManageClasses: () => void;
}

export const CourseActions = ({
  onEdit,
  onViewStudents,
  onManageClasses,
}: CourseActionsProps) => {
  return (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <FileEdit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onViewStudents}>
        <Users className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onManageClasses}>
        <Calendar className="h-4 w-4" />
      </Button>
    </div>
  );
};
