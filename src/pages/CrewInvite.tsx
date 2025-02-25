import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
const CrewInvite = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("code");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const generateVerificationCode = () => {
    return Math.random().toString().substr(2, 6);
  };
  const handleSendVerificationCode = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const code = generateVerificationCode();

      // Store the verification code
      const {
        error: dbError
      } = await supabase.from('verification_codes').insert([{
        email,
        code
      }]);
      if (dbError) throw dbError;

      // Send the verification email
      const response = await supabase.functions.invoke('send-verification', {
        body: {
          email,
          code
        }
      });
      if (response.error) throw response.error;
      setShowVerificationInput(true);
      toast({
        title: "Verification code sent!",
        description: "Please check your email for the verification code."
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification code. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignup = async () => {
    if (!phoneNumber || !gender || !email) return;
    try {
      setLoading(true);

      // Verify the code
      const {
        data: codes,
        error: verifyError
      } = await supabase.from('verification_codes').select('*').eq('email', email).eq('code', verificationCode).eq('used', false).gt('expires_at', new Date().toISOString()).limit(1).single();
      if (verifyError || !codes) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please check your verification code and try again."
        });
        return;
      }

      // Mark code as used
      await supabase.from('verification_codes').update({
        used: true
      }).eq('id', codes.id);

      // Proceed with signup
      console.log("Signing up:", {
        phoneNumber,
        gender,
        email,
        referralCode
      });
      toast({
        title: "Success!",
        description: "Your account has been created."
      });
    } catch (error) {
      console.error('Error during signup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete signup. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-3 text-white">"the duo"</h1>
        <p className="text-gray-400 mb-8 text-base">
          {referralCode ? "Complete your signup to join your partner" : "Sign up first and we'll send you a code to invite your partner"}
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
            <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full pr-12" />
            {!showVerificationInput && <Button size="icon" onClick={handleSendVerificationCode} disabled={!email || loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-400 hover:bg-blue-300">
                <ArrowRight className="h-4 w-4 text-white" />
              </Button>}
          </div>

          {showVerificationInput && <Input type="text" placeholder="Enter verification code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" maxLength={6} />}

          <Input type="tel" placeholder="(123) 456-7890" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" />

          <Button onClick={handleSignup} disabled={!phoneNumber || !gender || !email || !verificationCode || loading} className="w-full text-white rounded-full bg-pink-400 hover:bg-pink-300">
            {loading ? "Processing..." : "Complete Signup"}
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            {referralCode ? "You'll be matched with your partner after signup" : "You'll receive a verification code via email to complete signup"}
          </p>
        </div>
      </div>
    </div>;
};
export default CrewInvite;