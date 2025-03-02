// Base type for timestamp fields
interface TimestampFields {
  created_at?: string;
  updated_at?: string;
}

// Course Archives
export interface CourseArchive extends TimestampFields {
  id: string;
  course_id: string;
  archived_at: string;
  archived_by: string;
  archive_reason?: string;
  is_template: boolean;
}

// Course Categories
export interface CourseCategory {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Course Tags
export interface CourseTag {
  id: string;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
}

// Course Tag Relations
export interface CourseTagRelation {
  course_id: string;
  tag_id: string;
  created_at?: string | null;
}

// Course Materials
export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  type: "link" | "file" | "document";
  url?: string | null;
  file_path?: string | null;
  folder_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
