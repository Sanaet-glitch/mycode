export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          class_session_id: string
          id: string
          latitude: number
          longitude: number
          marked_at: string
          overridden_by: string | null
          override_reason: string | null
          status: string | null
          student_id: string
          verification_attempts: number | null
          verification_method: string | null
        }
        Insert: {
          class_session_id: string
          id?: string
          latitude: number
          longitude: number
          marked_at?: string
          overridden_by?: string | null
          override_reason?: string | null
          status?: string | null
          student_id: string
          verification_attempts?: number | null
          verification_method?: string | null
        }
        Update: {
          class_session_id?: string
          id?: string
          latitude?: number
          longitude?: number
          marked_at?: string
          overridden_by?: string | null
          override_reason?: string | null
          status?: string | null
          student_id?: string
          verification_attempts?: number | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_student_profile"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          beacon_latitude: number | null
          beacon_longitude: number | null
          class_id: string
          created_at: string
          id: string
          is_active: boolean | null
          proximity_radius: number | null
          retry_count: number | null
          retry_interval: number | null
          session_date: string
        }
        Insert: {
          beacon_latitude?: number | null
          beacon_longitude?: number | null
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          proximity_radius?: number | null
          retry_count?: number | null
          retry_interval?: number | null
          session_date: string
        }
        Update: {
          beacon_latitude?: number | null
          beacon_longitude?: number | null
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          proximity_radius?: number | null
          retry_count?: number | null
          retry_interval?: number | null
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          course_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          name: string
          start_time: string
          venue: string
        }
        Insert: {
          course_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          name: string
          start_time: string
          venue: string
        }
        Update: {
          course_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_archives: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          course_id: string | null
          created_at: string | null
          id: string
          is_template: boolean | null
          updated_at: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          updated_at?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_archives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_materials: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          title: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tag_relations: {
        Row: {
          course_id: string
          created_at: string | null
          tag_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          tag_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tag_relations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "course_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          enrollment_key: string
          id: string
          lecturer_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enrollment_key: string
          id?: string
          lecturer_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enrollment_key?: string
          id?: string
          lecturer_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lecturer_profile"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrollment_date: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          course_id: string
          enrollment_date?: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          course_id?: string
          enrollment_date?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_student_profile"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          avatar_url: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role: string
          avatar_url?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          avatar_url?: string | null
        }
        Relationships: []
      }
      server_status: {
        Row: {
          id: string
          cpu_usage: number
          memory_usage: number
          disk_usage: number
          uptime_seconds: number
          is_database_connected: boolean
          environment: string
          version: string
          node_version: string
          last_backup_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cpu_usage: number
          memory_usage: number
          disk_usage: number
          uptime_seconds: number
          is_database_connected: boolean
          environment: string
          version: string
          node_version: string
          last_backup_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cpu_usage?: number
          memory_usage?: number
          disk_usage?: number
          uptime_seconds?: number
          is_database_connected?: boolean
          environment?: string
          version?: string
          node_version?: string
          last_backup_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          site_name: string
          site_description: string | null
          contact_email: string | null
          support_email: string | null
          logo_url: string | null
          favicon_url: string | null
          primary_color: string | null
          allow_registration: boolean
          require_email_verification: boolean
          max_login_attempts: number | null
          default_user_role: string | null
          allowed_file_types: string | null
          max_file_size: number | null
          maintenance_mode: boolean
          time_zone: string | null
          date_format: string | null
          time_format: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_name?: string
          site_description?: string | null
          contact_email?: string | null
          support_email?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string | null
          allow_registration?: boolean
          require_email_verification?: boolean
          max_login_attempts?: number | null
          default_user_role?: string | null
          allowed_file_types?: string | null
          max_file_size?: number | null
          maintenance_mode?: boolean
          time_zone?: string | null
          date_format?: string | null
          time_format?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_name?: string
          site_description?: string | null
          contact_email?: string | null
          support_email?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string | null
          allow_registration?: boolean
          require_email_verification?: boolean
          max_login_attempts?: number | null
          default_user_role?: string | null
          allowed_file_types?: string | null
          max_file_size?: number | null
          maintenance_mode?: boolean
          time_zone?: string | null
          date_format?: string | null
          time_format?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_scheduled_classes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_server_status: {
        Args: Record<string, never>
        Returns: Database['public']['Tables']['server_status']['Row'][]
      }
      get_server_status_history: {
        Args: {
          days_back: number
        }
        Returns: Database['public']['Tables']['server_status']['Row'][]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
