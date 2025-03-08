import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This function tests if email sending works properly
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Get test email address from request
    const { email } = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call the send-email function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: email,
        subject: 'Test Email - Campus Connect',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Test Email Successful!</h1>
            <p>This is a test email from your Campus Connect application.</p>
            <p>If you're receiving this message, your email configuration is working correctly.</p>
            <p>Environment variables that are properly set:</p>
            <ul>
              <li>EMAIL_SERVICE_API_KEY: ${!!Deno.env.get('EMAIL_SERVICE_API_KEY') ? '✓' : '✗'}</li>
              <li>EMAIL_SERVICE_DOMAIN: ${!!Deno.env.get('EMAIL_SERVICE_DOMAIN') ? '✓' : '✗'}</li>
              <li>EMAIL_FROM: ${!!Deno.env.get('EMAIL_FROM') ? '✓' : '✗'}</li>
              <li>SUPABASE_URL: ${!!Deno.env.get('SUPABASE_URL') ? '✓' : '✗'}</li>
              <li>SUPABASE_SERVICE_ROLE_KEY: ${!!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✓' : '✗'}</li>
              <li>APP_URL: ${!!Deno.env.get('APP_URL') ? '✓' : '✗'}</li>
            </ul>
            <p>Time of test: ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    })

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ 
        message: 'Test email sent',
        success: response.ok,
        result 
      }),
      { 
        status: response.ok ? 200 : 500, 
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