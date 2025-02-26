
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

interface ReferralEmailRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: ReferralEmailRequest = await req.json();
    console.log("Processing referral request for:", email);

    // If this is a new access request
    if (code === "REQUEST") {
      console.log("Creating new access request for:", email);
      
      // Generate a unique approval token
      const approvalToken = crypto.randomUUID();

      // Create access request in the database
      const { error: dbError } = await supabase
        .from('access_requests')
        .insert({
          email,
          status: 'pending',
          approval_token: approvalToken
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to create access request");
      }

      // Send notification email to admin
      const emailResponse = await resend.emails.send({
        from: "Inntro Social <support@inntro.us>",
        to: ["support@inntro.us"],
        subject: "New Access Request - Inntro Social",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New Access Request</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p>
              <a href="${Deno.env.get("APP_URL")}/admin/approve/${approvalToken}" style="color: #4CAF50;">Approve</a>
              or
              <a href="${Deno.env.get("APP_URL")}/admin/reject/${approvalToken}" style="color: #f44336;">Reject</a>
            </p>
          </div>
        `,
      });
      
      console.log("Admin notification email sent:", emailResponse);
      
      return new Response(
        JSON.stringify({ message: "Request received and pending approval" }), 
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // For sending actual referral codes
    console.log("Sending referral code email to:", email);
    const emailResponse = await resend.emails.send({
      from: "Inntro Social <support@inntro.us>",
      to: [email],
      subject: "Your Friend Invited You to Join Their Inntro Social Account",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to Inntro Social!</h2>
          <p>Your friend has invited you to join their account on Inntro Social. This way, you'll be able to find amazing people together!</p>
          <p>Here's your personal access code:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; text-align: center; margin: 20px 0;">
            ${code}
          </div>
          <p>Enter this code when signing up to join your friend's account.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br>
            The Inntro Social Team
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-referral function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process referral request" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
