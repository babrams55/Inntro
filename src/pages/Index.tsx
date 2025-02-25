
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function Index() {
  const [code, setCode] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAccessRequest = async () => {
    if (!email || !instagram || !university) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('handle-access', {
        body: { 
          action: 'request',
          email,
          instagram,
          university
        }
      });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "We'll review your request and get back to you soon!",
      });
      setShowRequestForm(false);
      setEmail("");
      setInstagram("");
      setUniversity("");
    } catch (error: any) {
      console.error('Error requesting access:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an access code",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select()
        .eq('code', code.toUpperCase())
        .eq('used', false)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "Please check your code and try again",
        });
        return;
      }

      await supabase
        .from('referral_codes')
        .update({ used: true })
        .eq('id', data.id);

      navigate("/city-selection");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Inntro</h1>
          <p className="text-gray-400">double dates</p>
        </div>

        {!showRequestForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter access code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg"
                maxLength={6}
              />
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || !code}
              >
                {loading ? "Checking..." : "Continue"}
              </Button>
            </div>
            <div className="text-center">
              <Button
                variant="link"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowRequestForm(true)}
              >
                Request Access
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Instagram handle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
            <Input
              type="text"
              placeholder="University"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleAccessRequest}
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit Request"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => {
                  setShowRequestForm(false);
                  setEmail("");
                  setInstagram("");
                  setUniversity("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
