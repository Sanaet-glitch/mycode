import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialsManager } from "./materials/MaterialsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseDetailsProps {
  courseId: string;
}

export const CourseDetails = ({ courseId }: CourseDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="materials">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          <TabsContent value="materials">
            <MaterialsManager courseId={courseId} />
          </TabsContent>
          {/* Other tabs content */}
        </Tabs>
      </CardContent>
    </Card>
  );
}; 