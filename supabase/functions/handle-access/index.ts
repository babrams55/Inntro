
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
    console.log('Received request:', await req.clone().text());
    const { token, approved } = await req.json();

    console.log('Processing request with token:', token, 'approved:', approved);

    if (!token) {
      throw new Error('Missing approval token');
    }

    // Get the request details using service role client
    const { data: requestData, error: requestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('approval_token', token)
      .single();

    console.log('Request data:', requestData, 'Error:', requestError);

    if (requestError || !requestData) {
      throw new Error('Invalid or expired approval token');
    }

    if (requestData.status !== 'pending') {
      throw new Error('Request has already been processed');
    }

    // Generate access code if approved
    if (approved) {
      const code = generateCode();
      console.log('Generated code:', code, 'for email:', requestData.email);
      
      // Create the referral code using service role client
      const { error: referralError } = await supabase
        .from('referral_codes')
        .insert({
          code,
          email_to: requestData.email,
          email_sent: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (referralError) {
        console.error('Error creating referral code:', referralError);
        throw new Error('Failed to create referral code');
      }

      // Send approval email with code to user
      const userEmailResult = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: [requestData.email],
        subject: "Welcome to Inntro Social!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to Inntro Social!</h1>
            <p>Your access request has been approved. Here's your access code:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; font-family: monospace;">
              ${code}
            </div>
            <p>This code will expire in 7 days. Enter it on the login screen to get started!</p>
          </div>
        `,
      });

      // Send notification to admin
      const adminEmailResult = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: [ADMIN_EMAIL],
        subject: `Access Granted - ${requestData.email}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Access Request Approved</h1>
            <p>You have approved access for: ${requestData.email}</p>
            <p>Generated access code: ${code}</p>
            <p>User Details:</p>
            <ul>
              <li>Instagram: ${requestData.instagram}</li>
              <li>University: ${requestData.university}</li>
            </ul>
          </div>
        `,
      });

      console.log('Email results:', { 
        userEmail: userEmailResult, 
        adminEmail: adminEmailResult 
      });

    } else {
      // Send rejection email to user
      const userEmailResult = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: [requestData.email],
        subject: "Inntro Social Access Request Update",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Update on Your Access Request</h1>
            <p>Thank you for your interest in Inntro Social. Unfortunately, we are unable to approve your access request at this time.</p>
            <p>Feel free to apply again in the future!</p>
          </div>
        `,
      });

      // Send notification to admin
      const adminEmailResult = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: [ADMIN_EMAIL],
        subject: `Access Denied - ${requestData.email}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Access Request Denied</h1>
            <p>You have denied access for: ${requestData.email}</p>
            <p>User Details:</p>
            <ul>
              <li>Instagram: ${requestData.instagram}</li>
              <li>University: ${requestData.university}</li>
            </ul>
          </div>
        `,
      });

      console.log('Email results:', { 
        userEmail: userEmailResult, 
        adminEmail: adminEmailResult 
      });
    }

    // Update request status using service role client
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({
        status: approved ? 'approved' : 'rejected'
      })
      .eq('approval_token', token);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      throw new Error('Failed to update request status');
    }

    console.log(`Successfully ${approved ? 'approved' : 'rejected'} request for ${requestData.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in handle-access:", error);
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
