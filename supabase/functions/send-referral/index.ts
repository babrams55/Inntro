
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, requestData, replyEndpoint } = await req.json();
    
    if (code === "REQUEST") {
      // This is an access request
      await resend.emails.send({
        from: "Inntro <support@inntro.us>",
        to: [email],
        subject: "New Inntro Access Request",
        html: `
          <h1>New Access Request</h1>
          <p><strong>Email:</strong> ${requestData.email}</p>
          <p><strong>Instagram:</strong> ${requestData.instagram}</p>
          <p><strong>University:</strong> ${requestData.university}</p>
          <div>
            <a href="${replyEndpoint}?email=${encodeURIComponent(requestData.email)}&approved=true" 
               style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">
              Approve
            </a>
            <a href="${replyEndpoint}?email=${encodeURIComponent(requestData.email)}&approved=false" 
               style="background: #f44336; color: white; padding: 10px 20px; text-decoration: none;">
              Reject
            </a>
          </div>
        `,
      });
    } else {
      // Regular referral code email
      await resend.emails.send({
        from: "Inntro <support@inntro.us>",
        to: [email],
        subject: "Your Inntro Invitation",
        html: `
          <h1>Welcome to Inntro!</h1>
          <p>You've been invited to join. Use this code to sign up:</p>
          <h2 style="font-family: monospace; background: #f4f4f4; padding: 20px; text-align: center;">${code}</h2>
          <p>This code will expire in 7 days.</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-referral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
