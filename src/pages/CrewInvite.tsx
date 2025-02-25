
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";

const CrewInvite = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("code");
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [email, setEmail] = useState("");

  const handleSignup = () => {
    if (!phoneNumber || !gender || !email) return;
    console.log("Signing up:", {
      phoneNumber,
      gender,
      email,
      referralCode
    });
    // Will implement signup logic and email code sending later
  };

  return <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-3 text-white">"the duo"</h1>
        <p className="text-gray-400 mb-8 text-base">
          {referralCode ? "Complete your signup to join your partner" : "Sign up first and we'll send you a code to invite your partner"}
        </p>
        
        <div className="space-y-4">
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-black/50 border-white/20 text-white rounded-full">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
            </SelectContent>
          </Select>

          <Input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} className="text-center bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full" />

          <div className="relative">
            <Input type="tel" placeholder="(123) 456-7890" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="text-center text-xl tracking-wider font-mono bg-black/50 border-white/20 text-white placeholder:text-gray-500 rounded-full pr-12" onKeyDown={e => e.key === 'Enter' && handleSignup()} />
            <Button size="icon" onClick={handleSignup} disabled={!phoneNumber || !gender || !email} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-400">
              <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            {referralCode ? 
              "You'll be matched with your partner after signup" : 
              "You'll receive a 6-digit code via email to invite your partner"}
          </p>
        </div>
      </div>
    </div>;
};

export default CrewInvite;
