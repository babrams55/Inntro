
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, instagram, university, approvalToken } = await req.json();

    if (action === 'request') {
      // Generate a unique token for the approval/rejection links
      const token = crypto.randomUUID();
      
      // Store the request details temporarily
      await supabase
        .from('access_requests')
        .insert({
          email,
          instagram,
          university,
          approval_token: token,
          status: 'pending'
        });

      // Send the request email to support
      await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: ["support@inntro.us"],
        subject: "New Access Request - Inntro Social",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>New Access Request</h1>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Instagram:</strong> ${instagram}</p>
            <p><strong>University:</strong> ${university}</p>
            <div style="margin: 30px 0;">
              <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-access?token=${token}&approved=true" 
                 style="display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-right: 12px;">
                Approve
              </a>
              <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-access?token=${token}&approved=false" 
                 style="display: inline-block; background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Reject
              </a>
            </div>
          </div>
        `,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } 
    else if (action === 'process') {
      // Get the request details
      const { data: requestData, error: requestError } = await supabase
        .from('access_requests')
        .select('*')
        .eq('approval_token', approvalToken)
        .single();

      if (requestError || !requestData) {
        throw new Error('Invalid or expired approval token');
      }

      if (requestData.status !== 'pending') {
        throw new Error('Request has already been processed');
      }

      // Generate access code if approved
      if (requestData.approved) {
        const code = generateCode();
        
        // Create the referral code
        await supabase
          .from('referral_codes')
          .insert({
            code,
            email_to: requestData.email,
            email_sent: true,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });

        // Send approval email with code
        await resend.emails.send({
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
      } else {
        // Send rejection email
        await resend.emails.send({
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
      }

      // Update request status
      await supabase
        .from('access_requests')
        .update({
          status: requestData.approved ? 'approved' : 'rejected'
        })
        .eq('approval_token', approvalToken);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action');

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
