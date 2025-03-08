import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'

// Create a Supabase client with the service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, email, fullName, temporaryPassword } = await req.json()

    // Validate input
    if (!user_id || !email || !temporaryPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate reset password URL
    const resetPasswordURL = `${APP_URL}/reset-password?token=${temporaryPassword}&email=${encodeURIComponent(email)}`

    // Create invitation email content
    const subject = 'Welcome to Campus Connect - Your Account is Ready'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Welcome to Campus Connect!</h1>
        <p>Hello ${fullName || 'there'},</p>
        <p>An account has been created for you on the Campus Connect platform. Please use the link below to set your password and access your account:</p>
        
        <div style="margin: 25px 0;">
          <a href="${resetPasswordURL}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Set Your Password</a>
        </div>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>If you have any questions, please contact your system administrator.</p>
        
        <p>Best regards,<br>The Campus Connect Team</p>
      </div>
    `

    // Call the send-email function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject,
        html,
      }),
    })

    const result = await response.json()
    
    // Update user metadata to track invitation
    await supabase
      .from('profiles')
      .update({ 
        invited_at: new Date().toISOString(),
        force_password_change: true
      })
      .eq('id', user_id)

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 