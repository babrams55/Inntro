
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Add this function to create a test referral code
  const createTestReferral = async () => {
    setLoading(true);
    try {
      const testEmail = "abramsecom@gmail.com";
      
      // Generate a random 6-character code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const newCode = Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');
      
      // Create the referral code in the database
      const { error: referralError } = await supabase
        .from('referral_codes')
        .insert([{
          code: newCode,
          created_by_email: testEmail,
          email_to: testEmail,
          email_sent: false
        }]);

      if (referralError) throw referralError;

      // Send the email
      const { error } = await supabase.functions.invoke('send-referral', {
        body: { code: newCode, email: testEmail }
      });

      if (error) throw error;

      // Update the referral code to mark email as sent
      await supabase
        .from('referral_codes')
        .update({ email_sent: true })
        .eq('code', newCode);

      toast({
        title: "Test email sent!",
        description: "Check your email for the access code.",
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      // Check if this is a valid code
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (referralError) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please check your code and try again.",
        });
        return;
      }

      await supabase
        .from('referral_codes')
        .update({ used: true })
        .eq('code', code);

      navigate('/city-selection');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
          <Sparkles className="h-12 w-12 text-pink-400 animate-pulse" />
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-8 text-white text-center font-['SF Pro Display','sans-serif']">Inntro social</h1>
        
        <div className="space-y-4 w-64 mx-auto">
          <div className="flex gap-2 items-center">
            <Input 
              type="text" 
              value={code}
              placeholder="access code"
              onChange={e => setCode(e.target.value.toUpperCase())} 
              maxLength={6} 
              className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" 
              onKeyDown={e => e.key === 'Enter' && handleSubmitCode()} 
              disabled={loading}
            />
            <Button
              onClick={handleSubmitCode}
              disabled={code.length !== 6 || loading}
              className="h-10 w-10 p-0 rounded-full bg-blue-500 hover:bg-blue-400"
            >
              <ArrowRight className="h-4 w-4 text-pink-400" />
            </Button>
          </div>
          
          {/* Add test button */}
          <Button
            onClick={createTestReferral}
            disabled={loading}
            variant="outline"
            className="w-full text-white bg-transparent border-white/20 hover:bg-white/10"
          >
            Send Test Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
