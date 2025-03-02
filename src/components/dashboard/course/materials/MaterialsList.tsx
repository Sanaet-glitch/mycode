
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CourseMaterial } from "@/types/database";
import { FileText, Link2, Trash2, ExternalLink, Download } from "lucide-react";
import { useCourseManagement } from "@/hooks/use-course-management";
import { useToast } from "@/hooks/use-toast";

interface MaterialsListProps {
  materials?: CourseMaterial[];
  isLoading: boolean;
}

export const MaterialsList = ({ materials, isLoading }: MaterialsListProps) => {
  const { courseMaterialApi } = useCourseManagement();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await courseMaterialApi.deleteMaterial(id);
      toast({
        title: "Material Deleted",
        description: "The material has been successfully deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete the material.",
      });
    }
  };

  if (isLoading) {
    return <div>Loading materials...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials?.map((material) => (
          <TableRow key={material.id}>
            <TableCell>
              {material.type === "file" ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </TableCell>
            <TableCell>{material.title}</TableCell>
            <TableCell>{material.description || "No description"}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                {material.type === "link" ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={material.url || "#"} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={material.url || "#"} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(material.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
