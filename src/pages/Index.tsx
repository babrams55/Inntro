
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-blue-300">Sparkk</h1>
        <div className="font-mono text-2xl tracking-wider mb-4 text-blue-200">
          847291
        </div>
        <div className="space-y-4 w-64 mx-auto">
          <Input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="text-center text-xl tracking-wider font-mono bg-neutral-900 border-neutral-800 text-blue-200 placeholder:text-neutral-600"
          />
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => console.log("Code submitted:", code)}
          >
            Submit
          </Button>
        </div>
        <p className="text-xl text-gray-600">
        </p>
      </div>
    </div>
  );
};

export default Index;
