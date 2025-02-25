
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const [code, setCode] = useState("");

  const handleSubmitCode = () => {
    if (code.length === 6) {
      console.log("Referral code submitted:", code);
      // Will implement navigation to crew invite page later
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
        <h1 className="text-4xl font-bold mb-8 text-white text-center font-['SF Pro Display','sans-serif']">
          intro
        </h1>
        
        <div className="space-y-4 w-64 mx-auto">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Enter referral code" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              maxLength={6} 
              className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full pr-12" 
              onKeyDown={e => e.key === 'Enter' && handleSubmitCode()}
            />
            <Button 
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-amber-500 hover:bg-amber-400 rounded-full"
              onClick={handleSubmitCode}
              disabled={code.length !== 6}
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Double-date matchmaking for Chicago singles
        </p>
      </div>
    </div>
  );
};

export default Index;
