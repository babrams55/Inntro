
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("Processing access request for:", email);

    // Send email to user confirming their request
    const emailResponse = await resend.emails.send({
      from: "Inntro Social <support@inntro.us>",
      to: [email],
      subject: "Your Inntro Social Access Request",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Thanks for your interest!</h2>
          <p>We've received your request to join Inntro Social.</p>
          <p>We'll review your request and get back to you soon.</p>
          <p>In the meantime, follow us on Instagram to stay updated!</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br>
            The Inntro Social Team
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Request received successfully" }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-referral function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process request" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
