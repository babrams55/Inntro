
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerificationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Intro <onboarding@resend.dev>",
      to: [email],
      subject: "Your Verification Code",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to "the duo"!</h2>
          <p>Here's your verification code to complete your signup:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; text-align: center; margin: 20px 0;">
            ${code}
          </div>
          <p>If you didn't request this code, please ignore this email.</p>
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
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
