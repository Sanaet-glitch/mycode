
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCourseManagement } from "@/hooks/use-course-management";
import { Upload, Loader2 } from "lucide-react";

interface FileUploaderProps {
  courseId: string;
  currentFolder?: string | null;
}

export const FileUploader = ({ courseId, currentFolder }: FileUploaderProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { courseMaterialApi } = useCourseManagement();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "File Required",
        description: "Please select a file to upload.",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title Required",
        description: "Please enter a title for the material.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { filePath, publicUrl } = await courseMaterialApi.uploadFile(courseId, selectedFile);
      
      await courseMaterialApi.addMaterial({
        course_id: courseId,
        title,
        description,
        type: "file",
        file_path: filePath,
        url: publicUrl,
        folder_id: currentFolder,
      });

      setTitle("");
      setDescription("");
      setSelectedFile(null);
      toast({
        title: "File Uploaded",
        description: "The file has been successfully uploaded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Material title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="mb-4"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        />
        <p className="text-sm text-muted-foreground mt-2">
          Supported files: PDF, DOC, DOCX, PNG, JPG (max 10MB)
        </p>
      </div>
      <Button 
        onClick={handleUpload} 
        disabled={isUploading || !selectedFile}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </>
        )}
      </Button>
    </div>
  );
};
