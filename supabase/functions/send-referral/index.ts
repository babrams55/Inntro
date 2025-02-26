
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("Processing email request for:", email);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { data, error } = await resend.emails.send({
      from: "Inntro Social <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Inntro Social!",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Thanks for your interest!</h2>
          <p>We've received your request to join Inntro Social.</p>
          <p>We'll review your request and get back to you soon.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Best regards,<br>
            The Inntro Social Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ message: "Email sent successfully", data }), 
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
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
