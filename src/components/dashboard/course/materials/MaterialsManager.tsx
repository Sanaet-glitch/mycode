import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "./FileUploader";
import { LinkAdder } from "./LinkAdder";
import { MaterialsList } from "./MaterialsList";
import { useCourseManagement } from "@/hooks/use-course-management";
import { CourseMaterial } from "@/types/database";

interface MaterialsManagerProps {
  courseId: string;
}

export const MaterialsManager = ({ courseId }: MaterialsManagerProps) => {
  const [activeTab, setActiveTab] = useState<"files" | "links">("files");
  const { useMaterials } = useCourseManagement();
  const { data: materials, isLoading } = useMaterials(courseId);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "links")}>
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>
        <TabsContent value="files">
          <FileUploader courseId={courseId} />
        </TabsContent>
        <TabsContent value="links">
          <LinkAdder courseId={courseId} />
        </TabsContent>
      </Tabs>

      <MaterialsList materials={materials} isLoading={isLoading} />
    </div>
  );
}; 