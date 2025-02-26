
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
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Processing email request for:", email);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("Resend API key is not configured");
    }

    const resend = new Resend(apiKey);
    
    try {
      const { data, error: resendError } = await resend.emails.send({
        from: "Inntro <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Inntro!",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Thanks for your interest!</h2>
            <p>We've received your request to join Inntro.</p>
            <p>We'll review your request and get back to you soon.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Best regards,<br>
              The Inntro Team
            </p>
          </div>
        `,
      });

      if (resendError) {
        console.error("Resend API error:", resendError);
        throw resendError;
      }

      console.log("Email sent successfully:", data);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email sent successfully"
        }), 
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      throw new Error("Failed to send email");
    }
  } catch (error: any) {
    console.error("Error in send-referral function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
};

serve(handler);
