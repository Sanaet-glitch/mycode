import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Replace with your actual email service configuration
const EMAIL_SERVICE_API_KEY = Deno.env.get('EMAIL_SERVICE_API_KEY') || ''
const EMAIL_SERVICE_DOMAIN = Deno.env.get('EMAIL_SERVICE_DOMAIN') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com'

interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

async function sendEmail(payload: EmailPayload) {
  // This example uses Mailgun, but you can replace with any email provider
  // such as SendGrid, AWS SES, etc.
  const url = `https://api.mailgun.net/v3/${EMAIL_SERVICE_DOMAIN}/messages`
  
  const formData = new FormData()
  formData.append('from', EMAIL_FROM)
  formData.append('to', payload.to)
  formData.append('subject', payload.subject)
  formData.append('html', payload.html)
  if (payload.text) {
    formData.append('text', payload.text)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`api:${EMAIL_SERVICE_API_KEY}`)}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    // Validate request
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, or html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send the email
    const result = await sendEmail({ to, subject, html, text })
    
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