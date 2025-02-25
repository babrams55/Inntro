
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const isDevelopment = process.env.NODE_ENV === 'development';
const BYPASS_CODE = '123456'; // Only used in development

export const useVerification = (email: string) => {
  const [loading, setLoading] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);

  const generateVerificationCode = () => {
    return isDevelopment ? BYPASS_CODE : Math.random().toString().substr(2, 6);
  };

  const sendVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const code = generateVerificationCode();
      
      const { error: dbError } = await supabase
        .from('verification_codes')
        .insert({ 
          email, 
          code,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes
        });

      if (dbError) throw dbError;

      if (!isDevelopment) {
        const response = await supabase.functions.invoke('send-verification', {
          body: { email, code }
        });

        if (response.error) throw response.error;
      } else {
        // In development, show the code in a toast for testing
        toast({
          title: "Development Mode",
          description: `Use verification code: ${code}`,
        });
      }

      setShowVerificationInput(true);
      toast({
        title: "Verification code sent!",
        description: isDevelopment 
          ? "Development mode: Check the toast above for the code."
          : "Please check your email for the verification code.",
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (verificationCode: string) => {
    if (!verificationCode) return false;
    
    try {
      setLoading(true);

      const { data: codes, error: verifyError } = await supabase
        .from('verification_codes')
        .select()
        .eq('email', email)
        .eq('code', verificationCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (verifyError || !codes) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please check your verification code and try again.",
        });
        return false;
      }

      // Mark verification code as used
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', codes.id);

      return true;
    } catch (error) {
      console.error('Error during verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify code. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    showVerificationInput,
    sendVerification,
    verifyCode,
    setShowVerificationInput
  };
};
