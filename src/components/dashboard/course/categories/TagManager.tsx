import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { useCourseManagement } from "@/hooks/use-course-management";
import { useToast } from "@/hooks/use-toast";
import { CourseTag } from "@/types/database";

interface TagManagerProps {
  courseId?: string;
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  showCreateNew?: boolean;
}

export const TagManager = ({
  courseId,
  selectedTags = [],
  onTagsChange,
  showCreateNew = true,
}: TagManagerProps) => {
  const [newTag, setNewTag] = useState("");
  const { useTags, useCourseTags } = useCourseManagement();
  const { data: allTags, isLoading: isLoadingTags } = useTags();
  const { data: courseTags, isLoading: isLoadingCourseTags } = useCourseTags(courseId || "");
  const { toast } = useToast();

  const handleCreateTag = async () => {
    if (!newTag.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Tag",
        description: "Please enter a tag name.",
      });
      return;
    }

    try {
      // Add tag creation logic here
      setNewTag("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create tag",
        description: "An error occurred while creating the tag.",
      });
    }
  };

  const toggleTag = (tagId: string) => {
    if (!onTagsChange) return;

    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];

    onTagsChange(newSelectedTags);
  };

  if (isLoadingTags || (courseId && isLoadingCourseTags)) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showCreateNew && (
        <div className="flex gap-2">
          <Input
            placeholder="New tag name..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button onClick={handleCreateTag}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allTags?.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTag(tag.id)}
          >
            {tag.name}
            {selectedTags.includes(tag.id) && (
              <X className="ml-1 h-3 w-3" onClick={(e) => {
                e.stopPropagation();
                toggleTag(tag.id);
              }} />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}; 