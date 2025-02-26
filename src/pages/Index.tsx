
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      const { data: referral, error: referralError } = await supabase
        .from('pair_referrals')
        .select('*')
        .eq('referral_code', accessCode)
        .maybeSingle();

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

      // Store the code in localStorage and navigate to profile setup
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
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/functions/v1/send-access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        },
        body: JSON.stringify({
          email,
          university,
          instagram
        })
      });

      if (!response.ok) throw new Error('Failed to submit request');

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

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-500">
            Inntro Social
          </h1>
          <p className="text-pink-500 text-xl">
            "double dates"
          </p>
        </div>

        {isRequestingAccess ? (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
            <Input
              type="text"
              placeholder="University (optional)"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
            <Input
              type="text"
              placeholder="Instagram handle (optional)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleRequestAccess}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => setIsRequestingAccess(false)}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAccessCode}
                disabled={loading}
              >
                Continue
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => setIsRequestingAccess(true)}
                disabled={loading}
              >
                Request Access
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
