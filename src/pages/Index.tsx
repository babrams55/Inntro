import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const handleSubmitCode = () => {
    if (code.length === 6) {
      console.log("Referral code submitted:", code);
      navigate(`/crew-invite?code=${code}`);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
          <Sparkles className="h-12 w-12 text-pink-400 animate-pulse" />
          <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-8 text-white text-center font-['SF Pro Display','sans-serif']">inntro "double dates"</h1>
        
        <div className="space-y-4 w-64 mx-auto">
          <div className="relative">
            <Input type="text" placeholder="Enter referral code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full pr-12" onKeyDown={e => e.key === 'Enter' && handleSubmitCode()} />
            <Button size="icon" onClick={handleSubmitCode} disabled={code.length !== 6} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-400">
              <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          </div>

          <Button onClick={() => navigate('/crew-invite')} variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/10">
            Or sign up without a code
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
      </p>
      </div>
    </div>;
};
export default Index;