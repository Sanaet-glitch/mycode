import { supabase } from './supabaseClient';

// Define email templates
type EmailTemplate = 'welcome_email' | 'password_reset' | 'notification' | 'password_reset_request';

interface EmailData {
  to: string;
  subject?: string;
  templateData?: Record<string, any>;
}

/**
 * Send an email using Supabase Edge Functions
 * 
 * In production, you would configure Supabase with an email provider like Resend, SendGrid, etc.
 * For now, this is a placeholder that logs the email and simulates the sending process.
 */
export async function sendEmail(
  template: EmailTemplate,
  data: EmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Sending email template: ${template} to: ${data.to}`);
    console.log("Email data:", data);
    
    // In production, you would use Supabase Edge Functions or a direct email API integration
    // Example with Supabase Edge Functions:
    /*
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        template,
        to: data.to,
        subject: data.subject,
        templateData: data.templateData
      }
    });
    
    if (error) throw error;
    return { success: true };
    */
    
    // For now, simulate a successful email send
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending email" 
    };
  }
}

/**
 * Sends a welcome email to a newly created user
 * @param email User's email address
 * @param password Temporary password
 * @returns Success status
 */
export const sendWelcomeEmail = async (email: string, password: string) => {
  try {
    // In a real production app, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For now, we'll simulate sending an email by logging to console and using Supabase Edge Functions if available
    
    const emailBody = `
      Welcome to Campus Connect!
      
      Your account has been created. Please use the following credentials to log in:
      
      Email: ${email}
      Temporary Password: ${password}
      
      You will be asked to change your password on first login.
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending welcome email to ${email}`);
    console.log(emailBody);
    
    // You would call your email service API here
    // For demo purposes, we'll return success without actually sending an email
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
};

/**
 * Sends a password reset email to a user
 * @param email User's email address
 * @param password New temporary password
 * @returns Success status
 */
export const sendPasswordResetEmail = async (email: string, password: string) => {
  try {
    // In a real production app, you would integrate with an email service
    
    const emailBody = `
      Password Reset Notification
      
      Your password has been reset by an administrator. Please use the following temporary password to log in:
      
      Email: ${email}
      Temporary Password: ${password}
      
      You will be asked to change your password on your next login.
      
      If you did not request this reset, please contact the administrator immediately.
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending password reset email to ${email}`);
    console.log(emailBody);
    
    // You would call your email service API here
    // For demo purposes, we'll return success without actually sending an email
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};

/**
 * Sends account update notification to a user
 * @param email User's email address
 * @param updateType Type of update (role, profile, etc.)
 * @returns Success status
 */
export const sendAccountUpdateEmail = async (email: string, updateType: string) => {
  try {
    const emailBody = `
      Account Update Notification
      
      Your account has been updated. The following changes were made:
      
      Update Type: ${updateType}
      
      If you did not expect this update, please contact the administrator.
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending account update email to ${email}`);
    console.log(emailBody);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending account update email:', error);
    return { success: false, error };
  }
};

/**
 * Sends bulk welcome emails to multiple users
 * @param users Array of user emails and passwords
 * @returns Success status with arrays of successful and failed emails
 */
export const sendBulkWelcomeEmails = async (users: Array<{ 
    email: string;
  password: string;
  fullName?: string;
  role?: string;
}>) => {
  const results = {
    successful: [] as string[],
    failed: [] as string[],
  };
  
  for (const user of users) {
    try {
      const result = await sendWelcomeEmail(user.email, user.password);
      if (result.success) {
        results.successful.push(user.email);
      } else {
        results.failed.push(user.email);
      }
    } catch (error) {
      results.failed.push(user.email);
    }
  }
  
  return results;
};

/**
 * Sends a notification email to users
 * @param emails List of recipient emails
 * @param subject Email subject
 * @param message Email message content
 * @returns Success status
 */
export const sendNotificationEmail = async (emails: string[], subject: string, message: string) => {
  try {
    // In a real app, you would use batch sending with your email provider
    
    const emailBody = `
      ${subject}
      
      ${message}
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending notification email to ${emails.length} recipients`);
    console.log(emailBody);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error };
  }
};

/**
 * Sends a password reset request email with a reset link
 * @param email User's email address
 * @param resetToken Token for password reset
 * @returns Success status
 */
export const sendPasswordResetRequestEmail = async (email: string, resetToken: string) => {
  try {
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    const emailBody = `
      Password Reset Request
      
      We received a request to reset your password. Please click the link below to reset your password:
      
      ${resetLink}
      
      If you did not request a password reset, please ignore this email.
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending password reset request email to ${email}`);
    console.log(emailBody);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset request email:', error);
    return { success: false, error };
  }
};

/**
 * Sends a password reset request notification to admin
 * @param userEmail Email of the user who requested the reset
 * @param adminEmail Email of the admin to notify
 * @returns Success status
 */
export const sendPasswordResetRequestNotification = async (userEmail: string, adminEmail: string) => {
  try {
    const emailBody = `
      Password Reset Request Notification
      
      A password reset was requested for the following user:
      
      User Email: ${userEmail}
      
      This is just a notification. No action is required.
      
      Best regards,
      Campus Connect Team
    `;
    
    console.log(`Sending password reset request notification to admin: ${adminEmail}`);
    console.log(emailBody);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset request notification:', error);
    return { success: false, error };
  }
}; 