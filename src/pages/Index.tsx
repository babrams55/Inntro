
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  
  const handleSubmitCode = () => {
    if (code.length === 6) {
      console.log("Access code submitted:", code);
      navigate(`/crew-invite?code=${code}`);
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
        <h1 className="text-4xl font-bold mb-8 text-white text-center font-['SF Pro Display','sans-serif']">Inntro "double dates"</h1>
        
        <div className="space-y-4 w-64 mx-auto">
          <Input 
            type="text" 
            value={code}
            placeholder="access code"
            onChange={e => setCode(e.target.value.toUpperCase())} 
            maxLength={6} 
            className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" 
            onKeyDown={e => e.key === 'Enter' && handleSubmitCode()} 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
