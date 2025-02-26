
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Insert into access_requests table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { error: dbError } = await supabaseClient
      .from('access_requests')
      .insert({
        email,
        university,
        instagram,
        status: 'pending'
      });

    if (dbError) throw dbError;

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "Inntro <hello@inntro.us>",
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

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error processing access request:", error);
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
