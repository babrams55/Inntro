
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

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-referral', {
        body: { 
          email,
          code: "REQUEST" // This will be replaced with actual code in the function
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Invitation sent successfully.",
      });
      setEmail("");
    } catch (error: any) {
      console.error('Error sending invitation:', error);
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
    <div className="container mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-6">Invite a Friend</h1>
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button 
          className="w-full" 
          onClick={handleInvite}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Invite"}
        </Button>
      </div>
    </div>
  );
};

export default CrewInvite;
