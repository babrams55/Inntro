
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
      const { error } = await supabase.functions.invoke('send-referral', {
        body: { 
          email: "support@inntro.us",
          code: "REQUEST",
          requestData: {
            email,
            instagram,
            university
          },
          replyEndpoint: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-access-response`
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-black to-purple-900">
      <div className="relative w-full max-w-md p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xl rounded-2xl" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
            <Sparkles className="h-12 w-12 text-pink-400 animate-pulse" />
            <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
          </div>
          
          <h1 className="text-4xl font-bold text-blue-400 font-['SF Pro Display','sans-serif']">
            Inntro social
          </h1>
          <p className="text-pink-400 text-lg">"double dates"</p>
          
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input 
                type="text" 
                value={code}
                placeholder="access code"
                onChange={e => setCode(e.target.value.toUpperCase())} 
                maxLength={6} 
                className="text-center text-xl tracking-wider font-mono bg-white/5 border-white/10 text-white placeholder:text-gray-400 rounded-full" 
                onKeyDown={e => e.key === 'Enter' && handleSubmitCode()} 
                disabled={loading}
              />
              <Button
                onClick={handleSubmitCode}
                disabled={code.length !== 6 || loading}
                className="h-10 w-10 p-0 rounded-full bg-blue-500 hover:bg-blue-400"
              >
                <ArrowRight className="h-4 w-4 text-white" />
              </Button>
            </div>
            
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                disabled={loading}
                variant="outline"
                className="w-full text-white bg-white/5 border-white/10 hover:bg-white/10"
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
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram handle"
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
                <Input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="University"
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleAccessRequest}
                  disabled={loading}
                  variant="outline"
                  className="w-full text-white bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Submit Request
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-gray-400 text-sm">made for the cool twenty-somethings</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
