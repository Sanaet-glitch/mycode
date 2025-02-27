import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { useCourseManagement } from "@/hooks/use-course-management";
import { useToast } from "@/hooks/use-toast";
import { CourseCategory } from "@/types/database";

export const CategoryManager = () => {
  const [newCategory, setNewCategory] = useState("");
  const { useCategories } = useCourseManagement();
  const { data: categories, isLoading } = useCategories();
  const { toast } = useToast();

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Category",
        description: "Please enter a category name.",
      });
      return;
    }

    try {
      // Add category logic here
      setNewCategory("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add category",
        description: "An error occurred while adding the category.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New category name..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button onClick={handleAddCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {categories?.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <span>{category.name}</span>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 