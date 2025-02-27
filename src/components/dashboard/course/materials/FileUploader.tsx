import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCourseManagement } from "@/hooks/use-course-management";
import { Upload, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
  courseId: string;
}

export const FileUploader = ({ courseId }: FileUploaderProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { courseMaterialApi } = useCourseManagement();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
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
      const file = acceptedFiles[0];
      const { filePath, publicUrl } = await courseMaterialApi.uploadFile(courseId, file);
      
      await courseMaterialApi.addMaterial({
        course_id: courseId,
        title,
        description,
        type: "file",
        file_path: filePath,
        url: publicUrl,
      });

      setTitle("");
      setDescription("");
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
  }, [courseId, title, description]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

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
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? "border-primary bg-primary/10" : "border-muted"}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        ) : (
          <div>
            <Upload className="h-6 w-6 mx-auto mb-2" />
            <p>Drag & drop a file here, or click to select</p>
          </div>
        )}
      </div>
    </div>
  );
}; 