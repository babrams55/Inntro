
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccessRequestData {
  email: string;
  university?: string;
  instagram?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, university, instagram }: AccessRequestData = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Generate a unique approval token
    const approvalToken = crypto.randomUUID();

    // Insert into access_requests table
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("access_requests")
      .insert({
        email,
        university: university || "",
        instagram: instagram || "",
        status: "pending",
        approval_token: approvalToken
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // If Resend API key is available, send confirmation email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const { Resend } = await import("npm:resend@2.0.0");
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: "Inntro <access@inntro.us>",
          to: [email],
          subject: "Access Request Received - Inntro Social",
          html: `
            <h1>Thanks for your interest in Inntro Social!</h1>
            <p>We've received your access request and we'll review it shortly.</p>
            <p>We'll send you an access code as soon as your request is approved.</p>
            <br>
            <p>Best regards,<br>The Inntro Team</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue despite email error
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error processing access request:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
