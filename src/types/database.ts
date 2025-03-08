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

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  student_id?: string;
  department?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  force_password_change?: boolean;
  is_active?: boolean;
  avatar_url?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ServerStatus {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime_seconds: number;
  is_database_connected: boolean;
  environment: string;
  version: string;
  node_version: string;
  last_backup_at: string;
  created_at: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  is_encrypted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  studentCount: number;
  lecturerCount: number;
  adminCount: number;
}
