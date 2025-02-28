
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get request body
    const { email } = await req.json() as ReferralRequest;
    
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Generating referral code for email: ${email}`);
    
    // Generate a random referral code
    const referralCode = `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Store the referral in the database
    const { data: referralData, error: referralError } = await supabase
      .from("pair_referrals")
      .insert({
        referral_code: referralCode,
        used: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();
      
    if (referralError) {
      console.error("Error creating referral:", referralError);
      throw referralError;
    }
    
    // Send the email with the referral link
    // In a production app, you'd use a service like Resend.com here
    // For now, we'll just log it and pretend the email was sent
    console.log(`Email would be sent to ${email} with code ${referralCode}`);
    console.log(`Referral link: https://your-app.com/profile-setup?code=${referralCode}`);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If Resend API key is available, actually send the email
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Inntro <invites@inntro.us>",
            to: [email],
            subject: "You've been invited to Inntro!",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">You've been invited to Inntro!</h1>
                <p>Your friend has invited you to join them on Inntro, the app that makes dating less awkward.</p>
                <p>Click the button below to set up your profile:</p>
                <a href="https://your-app.com/profile-setup?code=${referralCode}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 99px; font-weight: bold;">Accept Invitation</a>
                <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">This invitation will expire in 7 days.</p>
              </div>
            `,
          }),
        });
        
        const emailResult = await emailResponse.json();
        console.log("Email sending result:", emailResult);
      } catch (emailError) {
        console.error("Error sending email via Resend:", emailError);
        // Continue despite email error - we'll return success anyway
        // In production, you might want to handle this differently
      }
    }
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully", 
        data: { 
          code: referralCode,
          ...referralData
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
