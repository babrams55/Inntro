
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "support@inntro.us";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle new access request submission
    if (req.method === 'POST') {
      const { email, instagram, university } = await req.json();
      
      if (!email || !instagram || !university) {
        throw new Error('Missing required fields');
      }

      const approval_token = crypto.randomUUID();

      // Create the access request
      const { error: requestError } = await supabase
        .from('access_requests')
        .insert([{
          email,
          instagram,
          university,
          approval_token,
          status: 'pending'
        }]);

      if (requestError) {
        throw new Error('Failed to create access request');
      }

      // Send admin notification email
      const adminEmailResult = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: [ADMIN_EMAIL],
        subject: "New Access Request - Inntro Social",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px; border-radius: 10px;">
            <h1 style="font-size: 28px; color: #fff; margin-bottom: 30px;">New Access Request</h1>
            
            <div style="margin-bottom: 20px;">
              <p style="font-size: 16px; margin: 10px 0;">
                <strong style="color: #fff;">Email:</strong> 
                <a href="mailto:${email}" style="color: #3897f0; text-decoration: none;">${email}</a>
              </p>
              
              <p style="font-size: 16px; margin: 10px 0;">
                <strong style="color: #fff;">Instagram:</strong> 
                <span style="color: #fff;">${instagram}</span>
              </p>
              
              <p style="font-size: 16px; margin: 10px 0;">
                <strong style="color: #fff;">University:</strong> 
                <span style="color: #fff;">${university}</span>
              </p>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 30px;">
              <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-access?token=${approval_token}&action=approve&key=${Deno.env.get("SUPABASE_ANON_KEY")}" 
                 style="background: #22C55E; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Approve
              </a>
              
              <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-access?token=${approval_token}&action=reject&key=${Deno.env.get("SUPABASE_ANON_KEY")}" 
                 style="background: #EF4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Reject
              </a>
            </div>
          </div>
        `,
      });

      console.log('Admin email sent:', adminEmailResult);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Handle approval/rejection via GET request (from email buttons)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');
      const action = url.searchParams.get('action');
      const key = url.searchParams.get('key');

      if (!token || !action) {
        throw new Error('Missing token or action');
      }

      if (key !== Deno.env.get("SUPABASE_ANON_KEY")) {
        throw new Error('Unauthorized');
      }

      const approved = action === 'approve';

      // Get the request details
      const { data: requestData, error: requestError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('approval_token', token)
        .single();

      if (requestError || !requestData) {
        throw new Error('Invalid or expired approval token');
      }

      if (requestData.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      if (approved) {
        const code = generateCode();
        
        // Create referral code
        const { error: referralError } = await supabase
          .from('referral_codes')
          .insert({
            code,
            email_to: requestData.email,
            email_sent: true,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (referralError) {
          throw new Error('Failed to create referral code');
        }

        // Send approval email to user
        await resend.emails.send({
          from: "Inntro Social <support@inntro.us>",
          to: [requestData.email],
          subject: "Welcome to Inntro Social!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #000;">Welcome to Inntro Social!</h1>
              <p>Your access request has been approved. Here's your access code:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; font-family: monospace; border-radius: 6px;">
                ${code}
              </div>
              <p>This code will expire in 7 days. Enter it on the login screen to get started!</p>
            </div>
          `,
        });
      } else {
        // Send rejection email
        await resend.emails.send({
          from: "Inntro Social <support@inntro.us>",
          to: [requestData.email],
          subject: "Inntro Social Access Request Update",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #000;">Update on Your Access Request</h1>
              <p>Thank you for your interest in Inntro Social. Unfortunately, we are unable to approve your access request at this time.</p>
              <p>Feel free to apply again in the future!</p>
            </div>
          `,
        });
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({
          status: approved ? 'approved' : 'rejected'
        })
        .eq('approval_token', token);

      if (updateError) {
        throw new Error('Failed to update request status');
      }

      // Return a simple HTML response for the button click
      return new Response(
        `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5;">
            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: ${approved ? '#22C55E' : '#EF4444'}">Request ${approved ? 'Approved' : 'Rejected'}</h1>
              <p>The user has been notified via email.</p>
            </div>
          </body>
        </html>
        `,
        {
          headers: { ...corsHeaders, "Content-Type": "text/html" },
          status: 200,
        }
      );
    }

    throw new Error('Invalid request method');

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};
