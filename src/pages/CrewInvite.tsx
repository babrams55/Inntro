
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useVerification } from "@/hooks/useVerification";
import { useReferralCode } from "@/hooks/useReferralCode";
import { ReferralStep } from "@/components/ReferralStep";

const CrewInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("code");
  
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [email, setEmail] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showReferralStep, setShowReferralStep] = useState(false);

  const {
    loading,
    showVerificationInput,
    sendVerification,
    verifyCode,
  } = useVerification(email);

  const {
    generatedReferralCode,
    referralCopied,
    createReferralCode,
    validateReferralCode,
    markReferralCodeAsUsed,
    copyReferralCode
  } = useReferralCode();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const areEmailsValid = isValidEmail(email) && isValidEmail(partnerEmail);

  useEffect(() => {
    const validateCode = async () => {
      if (referralCode) {
        const { isValid } = await validateReferralCode(referralCode);
        if (!isValid) {
          toast({
            variant: "destructive",
            title: "Invalid referral code",
            description: "This code is invalid or has expired. Please get a new code from your friend.",
          });
          navigate('/');
        }
      }
    };

    validateCode();
  }, [referralCode, navigate, validateReferralCode]);

  const handleVerifyCode = async () => {
    if (!verificationCode) return;
    
    const isValid = await verifyCode(verificationCode);
    
    if (isValid) {
      if (referralCode) {
        await markReferralCodeAsUsed(referralCode, email);
        navigate("/profile-setup");
      } else {
        await createReferralCode(email);
        setShowReferralStep(true);
      }
    }
  };

  if (showReferralStep) {
    return (
      <ReferralStep
        generatedReferralCode={generatedReferralCode}
        referralCopied={referralCopied}
        onCopyCode={copyReferralCode}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-3 text-white">Join Your Social Group</h1>
        <p className="text-gray-400 mb-8 text-base text-center">
          Connect with friends and join exclusive events! Invite your friend to get started.
        </p>
        
        <div className="space-y-4 mb-8">
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-black/50 border-white/20 text-white rounded-full text-center flex justify-center">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-4">
            <Input 
              type="email" 
              placeholder="Your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full"
            />

            <Input 
              type="email" 
              placeholder="Your friend's email" 
              value={partnerEmail} 
              onChange={e => setPartnerEmail(e.target.value)}
              className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full"
            />

            {!showVerificationInput && (
              <Button
                onClick={sendVerification}
                disabled={!areEmailsValid || loading}
                className={`w-full h-12 rounded-full transition-all duration-300 ${
                  areEmailsValid 
                    ? 'bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/50' 
                    : 'bg-blue-500/30'
                }`}
              >
                <ArrowRight className={`h-6 w-6 transition-transform duration-300 ${
                  areEmailsValid ? 'scale-125' : 'scale-100'
                }`} />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 text-center mt-8">
          <p className="text-white">
            Join exclusive local events and activities
          </p>
          <p className="text-white">
            Monthly member events
            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Coming Soon</span>
          </p>
        </div>

        {showVerificationInput && (
          <div className="space-y-4 mt-8">
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
  );
};

export default CrewInvite;
