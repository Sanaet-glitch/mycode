import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Folder Name",
        description: "Please enter a folder name.",
      });
      return;
    }

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: newFolderName,
      parentId: currentFolder,
    };

    setFolders([...folders, newFolder]);
    setNewFolderName("");
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