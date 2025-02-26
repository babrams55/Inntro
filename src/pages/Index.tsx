
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
    console.log('handleAccessRequest called');
    if (!email || !instagram || !university) {
      console.log('Missing fields:', { email, instagram, university });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    setLoading(true);
    console.log('Attempting to submit access request:', { email, instagram, university });

    try {
      // First, let's verify the response directly
      const response = await supabase
        .from('access_requests')
        .insert([{
          email,
          instagram,
          university,
          approval_token: crypto.randomUUID(),
          status: 'pending'
        }]);

      console.log('Raw Supabase response:', response);

      if (response.error) {
        console.error('Supabase error:', response.error);
        throw response.error;
      }

      console.log('Access request submitted successfully');
      
      toast({
        title: "Request Sent Successfully",
        description: "We'll review your request and get back to you soon!"
      });
      
      // Reset form and state
      setShowRequestForm(false);
      setEmail("");
      setInstagram("");
      setUniversity("");
    } catch (error: any) {
      console.error('Error details:', error);
      toast({
        variant: "destructive",
        title: "Error Submitting Request",
        description: error.message || "Failed to submit request. Please try again."
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
        description: "Please enter an access code"
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
          description: "Please check your code and try again"
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
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-blue-500">Inntro Social</h1>
          <p className="text-pink-400">&quot;double dates&quot;</p>
        </div>

        {!showRequestForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter access code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg rounded-2xl bg-gray-900 text-white placeholder:text-white/70"
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
              onChange={e => setEmail(e.target.value)}
              className="bg-gray-900 text-white placeholder:text-white/70"
            />
            <Input
              type="text"
              placeholder="Instagram handle"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className="bg-gray-900 text-white placeholder:text-white/70"
            />
            <Input
              type="text"
              placeholder="University"
              value={university}
              onChange={e => setUniversity(e.target.value)}
              className="bg-gray-900 text-white placeholder:text-white/70"
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
