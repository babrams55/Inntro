
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CrewInvite = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect /invite to /crew-invite for consistency
    if (location.pathname === "/invite") {
      navigate("/crew-invite", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleInvite = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the pair_referrals record
      const { data: referralData, error: referralError } = await supabase
        .from('pair_referrals')
        .insert({
          referral_code: Array.from({ length: 6 }, () => 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
          ).join(''),
          inviter_pair_id: null // Will be updated after profile setup
        })
        .select()
        .single();

      if (referralError) throw referralError;

      console.log("About to invoke send-referral function for:", email);
      
      const { data, error } = await supabase.functions.invoke("send-referral", {
        body: { 
          email,
          referralCode: referralData.referral_code
        },
        headers: {
          "Content-Type": "application/json",
        }
      });

      console.log("Raw function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Failed to send invitation: ${error.message}`);
      }

      if (!data?.success) {
        console.error("Function returned unsuccessful:", data);
        throw new Error(data?.error || "Failed to send invitation");
      }

      // Store the referral code in localStorage to update it after profile setup
      localStorage.setItem('lastReferralId', referralData.id);

      toast({
        title: "Success!",
        description: "Invitation sent successfully.",
      });
      
      setEmail("");
      console.log("Navigating to profile-setup");
      navigate("/profile-setup");
    } catch (error: any) {
      console.error("Full error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-blue-500">Invite ur sidekick.</h1>
        </div>
        
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-center text-lg rounded-2xl bg-gray-900 text-white placeholder:text-white/70"
          />
          <Button 
            className="w-full" 
            onClick={handleInvite}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Invite"}
          </Button>
          <p className="text-pink-400 text-center mt-4">Dating isn't awkward anymore</p>
        </div>
      </div>
    </div>
  );
};

export default CrewInvite;
