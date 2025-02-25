
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const [code, setCode] = useState("");
  return <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center">
        <div className="mb-4">
          <Sparkles className="h-12 w-12 text-pink-400 mx-auto animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-2 text-blue-300 text-center">Sparkk "Events"</h1>
        
        <div className="space-y-4 w-64 mx-auto">
          <div className="relative">
            <Input type="text" placeholder="Enter code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} className="text-center text-xl tracking-wider font-mono bg-neutral-900 border-neutral-800 text-blue-200 placeholder:text-neutral-600 rounded-full pr-12" />
            <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-pink-400 hover:bg-pink-300 rounded-full" onClick={() => console.log("Code submitted:", code)}>
              <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
        <p className="text-xl text-gray-600">
        </p>
      </div>
    </div>;
};

export default Index;
