
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles, ArrowRight, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useVerification } from "@/hooks/useVerification";
import { useReferralCode } from "@/hooks/useReferralCode";

const Index = () => {
  const [code, setCode] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const navigate = useNavigate();
  const { createReferralCode } = useReferralCode();
  
  const handleSubmitCode = async () => {
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      // Check if this is a partner code
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
        setShowInvite(true);
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

  const handleInviteFriend = async () => {
    if (!friendEmail) return;

    setLoading(true);
    try {
      await createReferralCode(friendEmail);
      setFriendEmail("");
      toast({
        title: "Invitation sent!",
        description: "Your friend will receive the code via email.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
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
          {!showInvite ? (
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
          ) : (
            <div className="space-y-4">
              <p className="text-white text-sm mb-4">Don't have a code? Invite a friend to join!</p>
              <div className="flex gap-2 items-center">
                <Input 
                  type="email" 
                  value={friendEmail}
                  placeholder="friend@email.com"
                  onChange={e => setFriendEmail(e.target.value)} 
                  className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" 
                  onKeyDown={e => e.key === 'Enter' && handleInviteFriend()} 
                  disabled={loading}
                />
                <Button
                  onClick={handleInviteFriend}
                  disabled={!friendEmail || loading}
                  className="h-10 w-10 p-0 rounded-full bg-pink-500 hover:bg-pink-400"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
              <Button
                onClick={() => setShowInvite(false)}
                variant="ghost"
                className="text-gray-400 hover:text-white text-sm"
              >
                Have a code? Enter it here
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
