
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Function invoked - starting process");
    
    // 1. Verify incoming data
    const { email } = await req.json();
    if (!email) {
      throw new Error("Email is required");
    }
    console.log("Processing invite for email:", email);

    // 2. Verify environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing");
      throw new Error("Internal configuration error");
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // 3. Generate referral code
    const code = Array.from(
      { length: 6 },
      () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
    
    console.log("Generated code:", code);

    // 4. Send email
    console.log("Attempting to send email...");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Inntro <onboarding@resend.dev>",
      to: email,
      subject: "Your Inntro Social Invitation Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Welcome to Inntro Social!</h1>
          <p>You've been invited to join Inntro Social. Here's your access code:</p>
          <div style="background-color: #1F2937; color: white; padding: 20px; border-radius: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Enter this code on the Inntro Social app to get started.</p>
          <p style="color: #EC4899;">Dating isn't awkward anymore!</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation sent successfully",
        code,
        emailData
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        }
      }
    );
  }
});
