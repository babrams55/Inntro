
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CrewInvite = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { data, error } = await supabase.functions.invoke("send-referral", {
        body: { email }
      });

      console.log("Response:", { data, error });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success!",
          description: "Invitation sent successfully.",
        });
        setEmail("");
      } else {
        throw new Error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error:", error);
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
