
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

const generateReferralCode = () => {
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
    const { email, approved } = await req.json();
    
    if (approved) {
      const code = generateReferralCode();
      
      // Create referral code in database
      const { error: dbError } = await supabase
        .from('referral_codes')
        .insert({
          code,
          email_to: email,
          email_sent: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (dbError) throw dbError;

      // Send approval email with code
      await resend.emails.send({
        from: "Inntro <support@inntro.us>",
        to: [email],
        subject: "Your Inntro Access Code",
        html: `
          <h1>Welcome to Inntro!</h1>
          <p>Your access request has been approved. Use this code to join:</p>
          <h2 style="font-family: monospace; background: #f4f4f4; padding: 20px; text-align: center;">${code}</h2>
          <p>This code will expire in 7 days.</p>
        `,
      });
    } else {
      // Send rejection email
      await resend.emails.send({
        from: "Inntro <support@inntro.us>",
        to: [email],
        subject: "Inntro Access Request Update",
        html: `
          <h1>Update on Your Inntro Request</h1>
          <p>Thank you for your interest in Inntro. Unfortunately, we are unable to approve your access request at this time.</p>
          <p>Feel free to apply again in the future!</p>
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
    console.error("Error in handle-access-response:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
