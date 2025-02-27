import { supabase } from "@/integrations/supabase/client";
import type { 
  CourseArchive, 
  CourseCategory, 
  CourseTag, 
  CourseTagRelation, 
  CourseMaterial 
} from "@/types/database";

// Archive Management
export const courseArchiveApi = {
  archiveCourse: async (courseId: string, reason?: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('course_archives')
      .insert({
        course_id: courseId,
        archived_by: user.user?.id,
        archive_reason: reason,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getArchives: async () => {
    const { data, error } = await supabase
      .from('course_archives')
      .select(`
        *,
        course:courses(*),
        archived_by_user:profiles!archived_by(full_name)
      `)
      .order('archived_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  restoreCourse: async (archiveId: string) => {
    const { error } = await supabase
      .from('course_archives')
      .delete()
      .eq('id', archiveId);

    if (error) throw error;
  },
};

// Category Management
export const courseCategoryApi = {
  createCategory: async (category: Partial<CourseCategory>) => {
    const { data, error } = await supabase
      .from('course_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCategories: async () => {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  updateCategory: async (id: string, updates: Partial<CourseCategory>) => {
    const { data, error } = await supabase
      .from('course_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Tag Management
export const courseTagApi = {
  createTag: async (tag: Partial<CourseTag>) => {
    const { data, error } = await supabase
      .from('course_tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getTags: async () => {
    const { data, error } = await supabase
      .from('course_tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  assignTagToCourse: async (courseId: string, tagId: string) => {
    const { data, error } = await supabase
      .from('course_tag_relations')
      .insert({
        course_id: courseId,
        tag_id: tagId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  removeTagFromCourse: async (courseId: string, tagId: string) => {
    const { error } = await supabase
      .from('course_tag_relations')
      .delete()
      .match({ course_id: courseId, tag_id: tagId });

    if (error) throw error;
  },

  getCoursesTags: async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_tag_relations')
      .select(`
        tag:course_tags(*)
      `)
      .eq('course_id', courseId);

    if (error) throw error;
    return data;
  },
};

// Course Materials Management
export const courseMaterialApi = {
  addMaterial: async (material: Partial<CourseMaterial>) => {
    const { data, error } = await supabase
      .from('course_materials')
      .insert(material)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getMaterials: async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  updateMaterial: async (id: string, updates: Partial<CourseMaterial>) => {
    const { data, error } = await supabase
      .from('course_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteMaterial: async (id: string) => {
    const { error } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // For file uploads
  uploadFile: async (courseId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `course-materials/${courseId}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath);

    return { filePath, publicUrl };
  },
}; 