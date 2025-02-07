import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileEdit, Key, Loader2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  enrollment_key: string;
}

interface Student {
  id: string;
  full_name: string;
  enrollment_date: string;
}

interface CourseManagementProps {
  userId: string;
}

export const CourseManagement = ({ userId }: CourseManagementProps) => {
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isViewStudentsOpen, setIsViewStudentsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('lecturer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch enrolled students for a course
  const { data: enrolledStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['enrolled-students', selectedCourse?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          enrollment_date,
          profiles (
            full_name
          )
        `)
        .eq('course_id', selectedCourse?.id)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      return data.map(enrollment => ({
        id: enrollment.student_id,
        full_name: enrollment.profiles.full_name,
        enrollment_date: new Date(enrollment.enrollment_date).toLocaleDateString(),
      }));
    },
    enabled: !!selectedCourse?.id && isViewStudentsOpen,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: { title: string; description: string }) => {
      const enrollmentKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            title: courseData.title,
            description: courseData.description,
            enrollment_key: enrollmentKey,
            lecturer_id: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateCourseOpen(false);
      setNewCourseTitle("");
      setNewCourseDescription("");
      toast({
        title: "Course created",
        description: "Your new course has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create course. Please try again.",
      });
    },
  });

  // Update course mutation
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
      setIsEditCourseOpen(false);
      setSelectedCourse(null);
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

  const handleCreateCourse = async () => {
    if (!newCourseTitle) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course title",
      });
      return;
    }

    createCourseMutation.mutate({
      title: newCourseTitle,
      description: newCourseDescription,
    });
  };

  const handleEditCourse = async () => {
    if (!selectedCourse || !selectedCourse.title) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course title",
      });
      return;
    }

    updateCourseMutation.mutate({
      id: selectedCourse.id,
      title: selectedCourse.title,
      description: selectedCourse.description || "",
      enrollment_key: selectedCourse.enrollment_key,
    });
  };

  const handleEditClick = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseOpen(true);
  };

  const handleViewStudentsClick = (course: Course) => {
    setSelectedCourse(course);
    setIsViewStudentsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Courses</h2>
        <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>Add a new course to your teaching schedule.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Course Title</Label>
                <Input
                  placeholder="Enter course title"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter course description"
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCourse}
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingCourses ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No courses yet. Create your first course to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enrollment Key</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.description || "No description"}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded">
                      {course.enrollment_key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(course)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudentsClick(course)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Course Dialog */}
      <Dialog open={isEditCourseOpen} onOpenChange={setIsEditCourseOpen}>
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
                value={selectedCourse?.title || ""}
                onChange={(e) =>
                  setSelectedCourse(
                    prev => prev ? { ...prev, title: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter course description"
                value={selectedCourse?.description || ""}
                onChange={(e) =>
                  setSelectedCourse(
                    prev => prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Enrollment Key</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter enrollment key"
                  value={selectedCourse?.enrollment_key || ""}
                  onChange={(e) =>
                    setSelectedCourse(
                      prev => prev ? { ...prev, enrollment_key: e.target.value } : null
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
                    setSelectedCourse(
                      prev => prev ? { ...prev, enrollment_key: newKey } : null
                    );
                  }}
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

      {/* View Enrolled Students Dialog */}
      <Dialog open={isViewStudentsOpen} onOpenChange={setIsViewStudentsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Enrolled Students</DialogTitle>
            <DialogDescription>
              Students enrolled in {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : enrolledStudents?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled in this course yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.enrollment_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
