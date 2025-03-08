import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for a system setting
 */
export interface SystemSetting {
  key: string;
  value: any;
  category: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Type for system setting categories
 */
export type SettingCategory = 
  | 'general'
  | 'appearance'
  | 'security'
  | 'email'
  | 'notification'
  | 'integration'
  | 'performance'
  | 'experimental'
  | 'custom';

/**
 * Get all system settings, optionally filtered by category
 */
export const getAllSettings = async (
  category?: SettingCategory
): Promise<SystemSetting[]> => {
  try {
    let query = supabase
      .from('system_settings')
      .select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('key');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting system settings:', error);
    throw error;
  }
};

/**
 * Get public system settings for client-side use
 */
export const getPublicSettings = async (): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_public', true);
    
    if (error) throw error;
    
    // Convert to key-value object
    const settings: Record<string, any> = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting public system settings:', error);
    return {};
  }
};

/**
 * Get a specific system setting by key
 */
export const getSetting = async (key: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw error;
    }
    
    return data.value;
  } catch (error) {
    console.error(`Error getting system setting ${key}:`, error);
    throw error;
  }
};

/**
 * Get multiple system settings by keys
 */
export const getMultipleSettings = async (
  keys: string[]
): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', keys);
    
    if (error) throw error;
    
    // Convert to key-value object
    const settings: Record<string, any> = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    
    // Add null for any missing keys
    keys.forEach(key => {
      if (!(key in settings)) {
        settings[key] = null;
      }
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting multiple system settings:', error);
    throw error;
  }
};

/**
 * Update a system setting
 */
export const updateSetting = async (
  key: string,
  value: any,
  description?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        value,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('key', key);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating system setting ${key}:`, error);
    throw error;
  }
};

/**
 * Create a new system setting
 */
export const createSetting = async (
  key: string,
  value: any,
  category: SettingCategory,
  description?: string,
  isPublic: boolean = false
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('system_settings')
      .insert({
        key,
        value,
        category,
        description,
        is_public: isPublic,
        created_at: now,
        updated_at: now
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error creating system setting ${key}:`, error);
    throw error;
  }
};

/**
 * Delete a system setting
 */
export const deleteSetting = async (key: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('key', key);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting system setting ${key}:`, error);
    throw error;
  }
};

/**
 * Update multiple settings at once
 */
export const updateMultipleSettings = async (
  settings: { key: string; value: any }[]
): Promise<boolean> => {
  try {
    // Use a Supabase transaction
    const updates = settings.map(({ key, value }) => (
      supabase
        .from('system_settings')
        .update({
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
    ));
    
    // Execute all updates
    for (const update of updates) {
      const { error } = await update;
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating multiple system settings:', error);
    throw error;
  }
};

/**
 * Get all setting categories with counts
 */
export const getSettingCategories = async (): Promise<{ category: string; count: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('category')
      .order('category');
    
    if (error) throw error;
    
    // Count categories
    const categoryCount: Record<string, number> = {};
    data?.forEach(item => {
      const category = item.category || 'uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Convert to array
    return Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));
  } catch (error) {
    console.error('Error getting setting categories:', error);
    return [];
  }
};

/**
 * Get application appearance settings
 */
export const getAppearanceSettings = async (): Promise<{
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss?: string;
}> => {
  try {
    const settings = await getMultipleSettings([
      'theme',
      'primaryColor',
      'logoUrl',
      'faviconUrl',
      'customCss'
    ]);
    
    return {
      theme: settings.theme || 'system',
      primaryColor: settings.primaryColor || '#1890ff',
      logoUrl: settings.logoUrl || '/logo.png',
      faviconUrl: settings.faviconUrl || '/favicon.ico',
      customCss: settings.customCss
    };
  } catch (error) {
    console.error('Error getting appearance settings:', error);
    
    // Return defaults
    return {
      theme: 'system',
      primaryColor: '#1890ff',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico'
    };
  }
};

/**
 * Get email configuration settings
 */
export const getEmailSettings = async (): Promise<{
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  apiKey?: string;
  domain?: string;
  region?: string;
}> => {
  try {
    const settings = await getMultipleSettings([
      'emailProvider',
      'emailFromAddress',
      'emailFromName',
      'smtpHost',
      'smtpPort',
      'smtpUser',
      'smtpPassword',
      'emailApiKey',
      'emailDomain',
      'emailRegion'
    ]);
    
    return {
      provider: settings.emailProvider || 'smtp',
      fromEmail: settings.emailFromAddress || 'noreply@example.com',
      fromName: settings.emailFromName || 'Campus Connect',
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPassword: settings.smtpPassword,
      apiKey: settings.emailApiKey,
      domain: settings.emailDomain,
      region: settings.emailRegion
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    
    // Return defaults
    return {
      provider: 'smtp',
      fromEmail: 'noreply@example.com',
      fromName: 'Campus Connect'
    };
  }
}; 