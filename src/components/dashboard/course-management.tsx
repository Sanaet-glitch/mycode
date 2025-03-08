import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseFormModal } from "./course-form-modal";
import { CourseDetailCard } from "./course-detail-card";
import { Course, Class } from "@/services/courseService";
import { Skeleton } from "@/components/ui/skeleton";
import { useLecturerCourses } from "@/hooks/use-courses";

export function CourseManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Use our custom hook to manage courses
  const {
    lecturerCourses,
    isLoadingLecturerCourses,
    activeCourses,
    archivedCourses,
    isCreatingCourse,
    isUpdatingCourse,
    isDeletingCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    createClass,
    updateClass,
    deleteClass
  } = useLecturerCourses();

  // Filter courses based on search query and active tab
  const filteredActiveCourses = activeCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchivedCourses = archivedCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle opening edit modal with course data
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCreateModalOpen(true);
  };

  // Handle create or update of a course
  const handleSubmitCourse = (courseData: Partial<Course>) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, courseData);
    } else {
      createCourse(courseData);
    }
    setIsCreateModalOpen(false);
    setEditingCourse(null);
  };

  // Handle creation of a class
  const handleAddClass = (classData: Partial<Class>) => {
    createClass(classData);
  };

  // Handle updating a class
  const handleEditClass = (classId: string, classData: Partial<Class>) => {
    updateClass(classId, classData);
  };

  // Handle delete a course
  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(courseId);
  };

  // Handle delete a class
  const handleDeleteClass = (classId: string) => {
    deleteClass(classId);
  };

  const isProcessing = isCreatingCourse || isUpdatingCourse || isDeletingCourse;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Course Management</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              setEditingCourse(null);
              setIsCreateModalOpen(true);
            }}
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="active" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Active Courses
            {activeCourses.length > 0 && (
              <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-2">
                {activeCourses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived Courses
            {archivedCourses.length > 0 && (
              <span className="ml-2 text-xs bg-muted rounded-full px-2">
                {archivedCourses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoadingLecturerCourses ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : filteredActiveCourses.length === 0 ? (
            searchQuery ? (
              <Alert>
                <AlertDescription>
                  No active courses match your search query. Try with a different term or clear the search.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No Active Courses</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active courses yet. Create your first course to get started.
                </p>
                <Button 
                  onClick={() => {
                    setEditingCourse(null);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </div>
            )
          ) : (
            <div>
              {filteredActiveCourses.map((course) => (
                <CourseDetailCard
                  key={course.id}
                  course={course}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onAddClass={handleAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {isLoadingLecturerCourses ? (
            <div className="space-y-4">
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-[150px] w-full" />
            </div>
          ) : filteredArchivedCourses.length === 0 ? (
            searchQuery ? (
              <Alert>
                <AlertDescription>
                  No archived courses match your search query. Try with a different term or clear the search.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have any archived courses. When you archive a course, it will appear here.
                </AlertDescription>
              </Alert>
            )
          ) : (
            <div>
              {filteredArchivedCourses.map((course) => (
                <CourseDetailCard
                  key={course.id}
                  course={course}
                  onEditCourse={handleEditCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onAddClass={handleAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CourseFormModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCourse(null);
        }}
        onSubmit={handleSubmitCourse}
        initialData={editingCourse || undefined}
        isProcessing={isCreatingCourse || isUpdatingCourse}
        mode={editingCourse ? 'edit' : 'create'}
      />
    </div>
  );
} 