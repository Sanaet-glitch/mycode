import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course, Class } from "@/services/courseService";
import { 
  CalendarDays, 
  Clock, 
  Edit, 
  MapPin, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Users 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClassFormModal } from "./class-form-modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatDate, getDayName, formatTime } from "@/lib/utils";

interface CourseDetailCardProps {
  course: Course;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddClass: (classData: Partial<Class>) => void;
  onEditClass: (classId: string, classData: Partial<Class>) => void;
  onDeleteClass: (classId: string) => void;
  isProcessing?: boolean;
}

export function CourseDetailCard({
  course,
  onEditCourse,
  onDeleteCourse,
  onAddClass,
  onEditClass,
  onDeleteClass,
  isProcessing = false
}: CourseDetailCardProps) {
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsEditClassOpen(true);
  };

  const handleDeleteClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDeleteClassOpen(true);
  };

  const confirmDeleteClass = () => {
    if (selectedClass) {
      onDeleteClass(selectedClass.id);
      setIsDeleteClassOpen(false);
    }
  };

  const confirmDeleteCourse = () => {
    onDeleteCourse(course.id);
    setIsDeleteCourseOpen(false);
  };

  const statusColor = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100",
    inactive: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100",
    archived: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{course.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <span>{course.code}</span>
              {course.semester && course.year && (
                <span>• {course.semester} {course.year}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColor[course.status || 'active']}>
              {course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || 'Active'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditCourse(course)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteCourseOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {course.description && (
          <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
        )}

        <div className="flex flex-wrap gap-6 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{course.credit_hours || 3} Credit Hours</span>
          </div>
          {course.department && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span>{course.department}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Class Sessions</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setIsAddClassOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Class
            </Button>
          </div>

          {course.classes && course.classes.length > 0 ? (
            <div className="space-y-3">
              {course.classes.map((classItem) => (
                <div 
                  key={classItem.id} 
                  className="flex justify-between items-center p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">{classItem.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      <span>{getDayName(classItem.day_of_week)}</span>
                      <span className="mx-1">•</span>
                      <Clock className="mr-1 h-3 w-3" />
                      <span>
                        {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                      </span>
                      {classItem.room && (
                        <>
                          <span className="mx-1">•</span>
                          <MapPin className="mr-1 h-3 w-3" />
                          <span>{classItem.room}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleEditClass(classItem)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => handleDeleteClass(classItem)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No class sessions scheduled yet.
              <br />
              Click "Add Class" to schedule your first session.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="text-xs text-muted-foreground">
          Last updated: {formatDate(course.updated_at || course.created_at)}
        </div>
      </CardFooter>

      {/* Modals */}
      <ClassFormModal
        open={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        onSubmit={(classData) => {
          onAddClass(classData);
          setIsAddClassOpen(false);
        }}
        courseId={course.id}
        isProcessing={isProcessing}
        mode="create"
      />

      {selectedClass && (
        <>
          <ClassFormModal
            open={isEditClassOpen}
            onClose={() => setIsEditClassOpen(false)}
            onSubmit={(classData) => {
              onEditClass(selectedClass.id, classData);
              setIsEditClassOpen(false);
            }}
            initialData={selectedClass}
            courseId={course.id}
            isProcessing={isProcessing}
            mode="edit"
          />

          <ConfirmationDialog
            open={isDeleteClassOpen}
            onOpenChange={setIsDeleteClassOpen}
            onConfirm={confirmDeleteClass}
            title="Delete Class Session"
            description={`Are you sure you want to delete the ${selectedClass.name} session? This action cannot be undone.`}
            confirmText="Delete Class"
            variant="destructive"
          />
        </>
      )}

      <ConfirmationDialog
        open={isDeleteCourseOpen}
        onOpenChange={setIsDeleteCourseOpen}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        description={`Are you sure you want to delete ${course.title} (${course.code})? This will also delete all class sessions and cannot be undone.`}
        confirmText="Delete Course"
        variant="destructive"
      />
    </Card>
  );
} 