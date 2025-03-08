import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This function tests if environment variables are properly set
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Test accessing environment variables (without revealing values)
    const environmentStatus = {
      EMAIL_SERVICE_API_KEY: !!Deno.env.get('EMAIL_SERVICE_API_KEY'),
      EMAIL_SERVICE_DOMAIN: !!Deno.env.get('EMAIL_SERVICE_DOMAIN'),
      EMAIL_FROM: !!Deno.env.get('EMAIL_FROM'),
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      APP_URL: !!Deno.env.get('APP_URL'),
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Environment variable check',
        status: environmentStatus,
        // Show a sample of the APP_URL to verify it's correct
        sample: {
          APP_URL: Deno.env.get('APP_URL') || 'Not set'
        }
      }),
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