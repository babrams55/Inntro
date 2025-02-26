import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [accessCode, setAccessCode] = useState("");
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccessCode = async () => {
    if (!accessCode) return;
    setLoading(true);
    try {
      const {
        data: referral,
        error: referralError
      } = await supabase.from('pair_referrals').select('*').eq('referral_code', accessCode).maybeSingle();
      if (referralError) throw referralError;
      if (!referral) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please check your code and try again"
        });
        return;
      }
      if (referral.used) {
        toast({
          variant: "destructive",
          title: "Code already used",
          description: "This code has already been used"
        });
        return;
      }
      localStorage.setItem('referralCode', accessCode);
      navigate('/profile-setup');
    } catch (error) {
      console.error('Error checking access code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify access code"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!email || !university || !instagram) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-access-request', {
        body: {
          email,
          university,
          instagram
        }
      });

      if (error) throw error;

      toast({
        title: "Request submitted!",
        description: "We'll review your request and get back to you soon."
      });
      setIsRequestingAccess(false);
      setEmail("");
      setUniversity("");
      setInstagram("");
    } catch (error) {
      console.error('Error requesting access:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit access request"
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Inntro Social
          </h1>
          <p className="text-pink-500 text-xl font-medium">Your "double date" app</p>
        </div>

        {isRequestingAccess ? <div className="space-y-4">
            <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className={cn("bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500", "focus:border-blue-500 focus:ring-1 focus:ring-blue-500")} required />
            <Input type="text" placeholder="University" value={university} onChange={e => setUniversity(e.target.value)} className={cn("bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500", "focus:border-blue-500 focus:ring-1 focus:ring-blue-500")} required />
            <Input type="text" placeholder="Instagram handle" value={instagram} onChange={e => setInstagram(e.target.value)} className={cn("bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500", "focus:border-blue-500 focus:ring-1 focus:ring-blue-500")} required />
            <div className="space-y-2">
              <Button className={cn("w-full bg-gradient-to-r from-blue-500 to-purple-500", "hover:from-blue-600 hover:to-purple-600 text-white font-medium")} onClick={handleRequestAccess} disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-[#1A1A1A]" onClick={() => setIsRequestingAccess(false)} disabled={loading}>
                Back
              </Button>
            </div>
          </div> : <div className="space-y-4">
            <Input type="text" placeholder="Enter access code" value={accessCode} onChange={e => setAccessCode(e.target.value)} className={cn("bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-gray-500", "focus:border-blue-500 focus:ring-1 focus:ring-blue-500")} />
            <div className="space-y-2">
              <Button className={cn("w-full bg-gradient-to-r from-blue-500 to-purple-500", "hover:from-blue-600 hover:to-purple-600 text-white font-medium")} onClick={handleAccessCode} disabled={loading}>
                Continue
              </Button>
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-[#1A1A1A]" onClick={() => setIsRequestingAccess(true)} disabled={loading}>
                Request Access
              </Button>
            </div>
          </div>}
      </div>
    </div>;
};

export default Index;
