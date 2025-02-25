
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useReferralCode = () => {
  const [generatedReferralCode, setGeneratedReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };

  const createReferralCode = async (email: string, partnerEmail: string) => {
    const newCode = generateReferralCode();
    
    // Create the referral code in the database
    const { error: referralError } = await supabase
      .from('referral_codes')
      .insert([{
        code: newCode,
        created_by_email: email,
        email_to: partnerEmail,
        email_sent: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }]);

    if (referralError) {
      console.error('Error creating referral code:', referralError);
      throw referralError;
    }

    // Send the email to the friend
    try {
      const { error } = await supabase.functions.invoke('send-referral', {
        body: { code: newCode, email: partnerEmail }
      });

      if (error) throw error;

      // Update the referral code to mark email as sent
      await supabase
        .from('referral_codes')
        .update({ email_sent: true })
        .eq('code', newCode);

      toast({
        title: "Invitation sent!",
        description: "We've sent your friend an email with their personal code.",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send email. Please try again.",
      });
    }

    setGeneratedReferralCode(newCode);
    return newCode;
  };

  const validateReferralCode = async (code: string) => {
    const { data, error } = await supabase
      .from('referral_codes')
      .select()
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    return { isValid: !error && !!data, data };
  };

  const markReferralCodeAsUsed = async (code: string, email: string) => {
    await supabase
      .from('referral_codes')
      .update({ 
        used: true,
        used_by_email: email 
      })
      .eq('code', code);
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedReferralCode);
      setReferralCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code to invite others.",
      });
      setTimeout(() => setReferralCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code. Please try manually.",
      });
    }
  };

  return {
    generatedReferralCode,
    referralCopied,
    createReferralCode,
    validateReferralCode,
    markReferralCodeAsUsed,
    copyReferralCode
  };
};
