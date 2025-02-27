import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "./FileUploader";
import { LinkAdder } from "./LinkAdder";
import { MaterialsList } from "./MaterialsList";
import { MaterialsSearch } from "./MaterialsSearch";
import { FolderManager } from "./FolderManager";
import { useCourseManagement } from "@/hooks/use-course-management";
import { CourseMaterial } from "@/types/database";

interface MaterialsManagerProps {
  courseId: string;
}

export const MaterialsManager = ({ courseId }: MaterialsManagerProps) => {
  const [activeTab, setActiveTab] = useState<"files" | "links">("files");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "file" | "link">("all");
  
  const { useMaterials } = useCourseManagement();
  const { data: materials, isLoading } = useMaterials(courseId);

  const filteredMaterials = materials?.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || material.type === typeFilter;
    const matchesFolder = material.folder_id === currentFolder;
    
    return matchesSearch && matchesType && matchesFolder;
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-1">
        <FolderManager 
          courseId={courseId}
          onFolderChange={setCurrentFolder}
        />
      </div>
      
      <div className="col-span-3 space-y-6">
        <MaterialsSearch 
          onSearch={setSearchQuery}
          onFilterChange={setTypeFilter}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "links")}>
          <TabsList>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
          <TabsContent value="files">
            <FileUploader 
              courseId={courseId}
              currentFolder={currentFolder}
            />
          </TabsContent>
          <TabsContent value="links">
            <LinkAdder 
              courseId={courseId}
              currentFolder={currentFolder}
            />
          </TabsContent>
        </Tabs>

        <MaterialsList 
          materials={filteredMaterials}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}; 