
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowRight, Copy, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CrewInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("code");
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedReferralCode, setGeneratedReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [showReferralStep, setShowReferralStep] = useState(false);

  useEffect(() => {
    const validateReferralCode = async () => {
      if (referralCode) {
        // Use generic types for the query
        const { data, error } = await supabase
          .from('referral_codes')
          .select()
          .eq('code', referralCode)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          toast({
            variant: "destructive",
            title: "Invalid referral code",
            description: "This code is invalid or has expired. Please get a new code from your friend.",
          });
          navigate('/');
        }
      }
    };

    validateReferralCode();
  }, [referralCode, navigate]);

  const generateVerificationCode = () => {
    return Math.random().toString().substr(2, 6);
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };

  const handleSendVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const code = generateVerificationCode();
      
      const { error: dbError } = await supabase
        .from('verification_codes')
        .insert([{ 
          email, 
          code,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes
        }]);

      if (dbError) throw dbError;

      const response = await supabase.functions.invoke('send-verification', {
        body: { email, code }
      });

      if (response.error) throw response.error;

      setShowVerificationInput(true);
      toast({
        title: "Verification code sent!",
        description: "Please check your email for the verification code.",
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

  const handleVerifyCode = async () => {
    if (!verificationCode) return;
    
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
        return;
      }

      // Mark verification code as used
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', codes.id);

      if (referralCode) {
        // Update referral code with used_by_email
        await supabase
          .from('referral_codes')
          .update({ 
            used: true,
            used_by_email: email 
          })
          .eq('code', referralCode);

        // Navigate to profile setup
        navigate("/profile-setup");
      } else {
        // Generate new referral code
        const newCode = generateReferralCode();
        const { error: referralError } = await supabase
          .from('referral_codes')
          .insert([{
            code: newCode,
            created_by_email: email
          }]);

        if (referralError) throw referralError;

        setGeneratedReferralCode(newCode);
        setShowReferralStep(true);
      }

    } catch (error) {
      console.error('Error during verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedReferralCode);
      setReferralCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code with your partner to complete signup.",
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

  if (showReferralStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-3 text-white">Share Your Code</h1>
          <p className="text-gray-400 mb-8 text-base">
            Share this code with your partner to complete signup together
          </p>

          <div className="space-y-6">
            <div className="relative">
              <Input
                type="text"
                value={generatedReferralCode}
                readOnly
                className="text-center text-2xl tracking-wider font-mono bg-black/50 border-white/20 text-white rounded-full pr-12"
              />
              <Button
                size="icon"
                onClick={copyReferralCode}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-pink-500 hover:bg-pink-400"
              >
                {referralCopied ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Copy className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>

            <Button
              onClick={() => navigate("/profile-setup")}
              className="w-full bg-pink-500 hover:bg-pink-400 text-white rounded-full"
            >
              Continue to Profile Setup
            </Button>

            <p className="text-sm text-gray-500">
              Your partner needs to enter this code to join. You can proceed to set up your profile in the meantime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-3 text-white">"the duo"</h1>
        <p className="text-gray-400 mb-8 text-base">
          {referralCode ? "Complete your signup to join your partner" : "Sign up and we'll send you a code to invite your partner"}
        </p>
        
        <div className="space-y-4">
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-black/50 border-white/20 text-white rounded-full">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input 
              type="email" 
              placeholder="Your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full pr-12"
            />
            {!showVerificationInput && (
              <Button
                size="icon"
                onClick={handleSendVerification}
                disabled={!email || loading}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-pink-500 hover:bg-pink-400"
              >
                <ArrowRight className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>

          {showVerificationInput && (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full"
                maxLength={6}
              />

              <Button
                onClick={handleVerifyCode}
                disabled={!verificationCode || loading}
                className="w-full bg-pink-500 hover:bg-pink-400 text-white rounded-full"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewInvite;
