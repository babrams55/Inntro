
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [university, setUniversity] = useState("");
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
      // Send the email using the edge function
      const { error } = await supabase.functions.invoke('send-referral', {
        body: { 
          email: "support@inntro.us", // Fixed email address
          code: "REQUEST",
          requestData: {
            email,
            instagram,
            university
          }
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      toast({
        title: "Request sent!",
        description: "We'll review your request and get back to you soon.",
      });
      setShowForm(false);
      setEmail("");
      setInstagram("");
      setUniversity("");
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      // Check if this is a valid code
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (referralError) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please check your code and try again.",
        });
        return;
      }

      await supabase
        .from('referral_codes')
        .update({ used: true })
        .eq('code', code);

      navigate('/city-selection');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to validate code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
          <Sparkles className="h-12 w-12 text-pink-400 animate-pulse" />
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-blue-500 text-center font-['SF Pro Display','sans-serif']">Inntro social</h1>
        <p className="text-pink-400 mb-8 text-lg">double dates</p>
        
        <div className="space-y-4 w-64 mx-auto">
          <div className="flex gap-2 items-center">
            <Input 
              type="text" 
              value={code}
              placeholder="access code"
              onChange={e => setCode(e.target.value.toUpperCase())} 
              maxLength={6} 
              className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" 
              onKeyDown={e => e.key === 'Enter' && handleSubmitCode()} 
              disabled={loading}
            />
            <Button
              onClick={handleSubmitCode}
              disabled={code.length !== 6 || loading}
              className="h-10 w-10 p-0 rounded-full bg-blue-500 hover:bg-blue-400"
            >
              <ArrowRight className="h-4 w-4 text-pink-400" />
            </Button>
          </div>
          
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              disabled={loading}
              variant="outline"
              className="w-full text-white bg-transparent border-white/20 hover:bg-white/10"
            >
              Request Access
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-black/50 border-white/20 text-white placeholder:text-gray-500"
              />
              <Input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram handle"
                className="w-full bg-black/50 border-white/20 text-white placeholder:text-gray-500"
              />
              <Input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="University"
                className="w-full bg-black/50 border-white/20 text-white placeholder:text-gray-500"
              />
              <Button
                onClick={handleAccessRequest}
                disabled={loading}
                variant="outline"
                className="w-full text-white bg-transparent border-white/20 hover:bg-white/10"
              >
                Submit Request
              </Button>
            </div>
          )}
        </div>
        <p className="text-gray-500 mt-8 text-sm">made for the cool twenty-somethings</p>
      </div>
    </div>
  );
};

export default Index;
