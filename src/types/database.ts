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
export interface CourseCategory extends TimestampFields {
  id: string;
  name: string;
  description?: string;
}

// Course Tags
export interface CourseTag extends TimestampFields {
  id: string;
  name: string;
}

// Course Tag Relations
export interface CourseTagRelation extends TimestampFields {
  course_id: string;
  tag_id: string;
}

// Course Materials
export interface CourseMaterial extends TimestampFields {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  type: 'document' | 'link' | 'file';
  url?: string;
  file_path?: string;
} 