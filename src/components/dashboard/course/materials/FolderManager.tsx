import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FolderManagerProps {
  courseId: string;
  onFolderChange: (folderId: string | null) => void;
}

export const FolderManager = ({ courseId, onFolderChange }: FolderManagerProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Folder Name",
        description: "Please enter a folder name.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        name: newFolderName,
        parentId: currentFolder,
      };

      setFolders([...folders, newFolder]);
      setNewFolderName("");
      toast({
        title: "Folder Created",
        description: "The folder has been created successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
    onFolderChange(folderId);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
    if (currentFolder === folderId) {
      handleSelectFolder(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Managing folders..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New folder name..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <Button onClick={handleCreateFolder}>
          <Plus className="h-4 w-4 mr-2" />
          Add Folder
        </Button>
      </div>

      <div className="space-y-2">
        <Button
          variant={currentFolder === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleSelectFolder(null)}
        >
          <Folder className="h-4 w-4 mr-2" />
          Root
        </Button>
        {folders
          .filter(f => f.parentId === currentFolder)
          .map(folder => (
            <div key={folder.id} className="flex items-center gap-2">
              <Button
                variant={currentFolder === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleSelectFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFolder(folder.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}; 