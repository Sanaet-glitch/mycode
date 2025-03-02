
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCourseManagement } from "@/hooks/use-course-management";
import { Link2 } from "lucide-react";

interface LinkAdderProps {
  courseId: string;
  currentFolder?: string | null;
}

export const LinkAdder = ({ courseId, currentFolder }: LinkAdderProps) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { courseMaterialApi } = useCourseManagement();

  const handleAddLink = async () => {
    if (!title.trim() || !url.trim()) {
      toast({
        variant: "destructive",
        title: "Required Fields",
        description: "Please enter both title and URL.",
      });
      return;
    }

    try {
      await courseMaterialApi.addMaterial({
        course_id: courseId,
        title,
        description,
        type: "link",
        url,
        folder_id: currentFolder,
      });

      setTitle("");
      setUrl("");
      setDescription("");
      toast({
        title: "Link Added",
        description: "The link has been successfully added.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Add Link",
        description: "An error occurred while adding the link.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Material title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="URL"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button onClick={handleAddLink}>
        <Link2 className="mr-2 h-4 w-4" />
        Add Link
      </Button>
    </div>
  );
};
