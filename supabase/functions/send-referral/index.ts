
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
    // 1. Verify incoming data
    const { email } = await req.json();
    if (!email) {
      throw new Error("Email is required");
    }
    console.log("Processing invite for email:", email);

    // 2. Verify environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration is missing");
    }

    // 3. Initialize Supabase client
    console.log("Initializing Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Generate and store referral code
    const code = Array.from(
      { length: 6 },
      () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
    console.log("Generated referral code:", code);

    // 5. Store code in database first
    console.log("Storing referral code in database...");
    const { error: dbError } = await supabase
      .from("referral_codes")
      .insert({
        code,
        email_to: email,
        created_by_email: "onboarding@resend.dev", // Using Resend's test email
        email_sent: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    // 6. Send email using Resend's test email
    console.log("Initializing Resend...");
    const resend = new Resend(resendApiKey);

    console.log("Sending email...");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Inntro <onboarding@resend.dev>", // Using Resend's test email
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

    // 7. Update database to mark email as sent
    console.log("Updating email sent status...");
    const { error: updateError } = await supabase
      .from("referral_codes")
      .update({ email_sent: true })
      .eq("code", code);

    if (updateError) {
      console.error("Error updating email_sent status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Invitation sent successfully",
        code,
        emailData // Include email response for debugging
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
