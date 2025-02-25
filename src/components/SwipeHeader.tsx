
import { Button } from "@/components/ui/button";
import { Copy, Check, UsersRound, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SwipeHeaderProps {
  referralCode: string;
  referralCopied: boolean;
  generateNewCode: () => void;
}

export const SwipeHeader = ({
  referralCode,
  referralCopied,
  generateNewCode
}: SwipeHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border-b border-white/10 flex justify-between items-center">
      <div className="w-28">
        <Button
          onClick={() => navigate('/chat')}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 flex items-center gap-2"
        >
          <MessageSquare className="h-5 w-5" />
          Our Duos
        </Button>
      </div>
      <h1 className="text-white text-2xl font-bold flex items-center gap-2">
        <UsersRound className="h-6 w-6" />
        Inntros
      </h1>
      <div className="w-28">
        <Button
          onClick={generateNewCode}
          variant="outline"
          size="sm"
          className="bg-blue-500 hover:bg-blue-400 text-white border-none rounded-full flex items-center gap-2"
        >
          {referralCode ? (
            <>
              {referralCode}
              {referralCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </>
          ) : (
            'Invite'
          )}
        </Button>
      </div>
    </div>
  );
};
