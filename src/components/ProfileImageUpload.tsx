import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onAvatarChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileImageUpload({
  userId,
  currentAvatarUrl,
  onAvatarChange,
  size = 'md'
}: ProfileImageUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // File size validation (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    // File type validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);
        
      const publicUrl = data.publicUrl;
      setAvatarUrl(publicUrl);
      
      // Call the callback if provided
      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || ""} />
        <AvatarFallback className="text-4xl">
          <User className={size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'} />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center">
        <Label htmlFor={`avatar-upload-${userId}`} className="cursor-pointer">
          <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{isUploading ? "Uploading..." : "Upload Photo"}</span>
          </div>
          <Input 
            id={`avatar-upload-${userId}`} 
            type="file" 
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
            onChange={handleAvatarUpload}
            disabled={isUploading} 
          />
        </Label>
      </div>
    </div>
  );
} 