
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReferralStepProps {
  generatedReferralCode: string;
  referralCopied: boolean;
  onCopyCode: () => void;
}

export const ReferralStep = ({ generatedReferralCode, referralCopied, onCopyCode }: ReferralStepProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold mb-3 text-white">Share Your Code</h1>
        <p className="text-gray-400 mb-8 text-base">
          Share this code with your partner to complete signup together
        </p>

        <div className="space-y-6">
          <div className="relative">
            <Input
              type="text"
              value={generatedReferralCode}
              readOnly
              className="text-center text-2xl tracking-wider font-mono bg-black/50 border-white/20 text-white rounded-full pr-12"
            />
            <Button
              size="icon"
              onClick={onCopyCode}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-pink-500 hover:bg-pink-400"
            >
              {referralCopied ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Copy className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>

          <Button
            onClick={() => navigate("/profile-setup")}
            className="w-full bg-pink-500 hover:bg-pink-400 text-white rounded-full"
          >
            Continue to Profile Setup
          </Button>

          <p className="text-sm text-gray-500">
            Your partner needs to enter this code to join. You can proceed to set up your profile in the meantime.
          </p>
        </div>
      </div>
    </div>
  );
};
