
import { useState, useEffect } from "react";
import { AnimatePresence, PanInfo } from "framer-motion";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SwipeHeader } from "@/components/SwipeHeader";
import { SwipeCard } from "@/components/SwipeCard";
import { SwipeActions } from "@/components/SwipeActions";
import { SWIPE_THRESHOLD, mockPairs, SwipeDirection, getMatchingPairs, Gender } from "@/utils/swipeUtils";

const SwipeScreen = () => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [swipedPairs, setSwipedPairs] = useState<{ [key: number]: SwipeDirection }>({});
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const userGender: Gender = "M";
  const currentPairId = "pair-id"; // TODO: Get this from auth context
  const filteredPairs = getMatchingPairs(userGender);

  useEffect(() => {
    const fetchReferralCode = async () => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code')
        .single();

      if (!error && data) {
        setReferralCode(data.code);
      }
    };

    fetchReferralCode();
  }, []);

  const generateNewCode = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    
    try {
      const { error } = await supabase
        .from('referral_codes')
        .insert([{
          code: code,
          created_by_email: 'user@example.com',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]);

      if (error) throw error;

      setReferralCode(code);
      await copyReferralCode(code);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite code.",
      });
    }
  };

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setReferralCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code with others to join.",
      });
      setTimeout(() => setReferralCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy code.",
      });
    }
  };

  const handleSwipe = (direction: SwipeDirection) => {
    setSwipedPairs(prev => ({
      ...prev,
      [filteredPairs[currentPairIndex].id]: direction
    }));

    if (direction === 'like' && Math.random() > 0.5) {
      const pair = filteredPairs[currentPairIndex];
      // Simulate a match with a random match ID
      const matchId = `match-${Date.now()}`;
      
      toast({
        title: "It's a match! 🎉",
        description: `Start chatting with ${pair.names}!`,
        action: (
          <Button 
            onClick={() => navigate('/chat', { 
              state: { 
                matchId,
                currentPairId,
                otherPairNames: pair.names,
                otherPairId: `other-${pair.id}` // TODO: Replace with actual pair ID
              }
            })}
          >
            Open Chat
          </Button>
        )
      });
    }

    if (currentPairIndex < filteredPairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      handleSwipe(info.offset.x > 0 ? 'like' : 'pass');
    } else {
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const currentPair = filteredPairs[currentPairIndex];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SwipeHeader
        referralCode={referralCode}
        referralCopied={referralCopied}
        generateNewCode={generateNewCode}
        onChatClick={() => navigate('/chat', { 
          state: { 
            matchId: "latest-match-id", // TODO: Get from matches list
            currentPairId,
            otherPairNames: "Latest Match", // TODO: Get from matches list
            otherPairId: "latest-match-pair-id" // TODO: Get from matches list
          }
        })}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {currentPair && (
            <motion.div
              key={currentPair.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragSnapToOrigin={true}
              onDragEnd={handleDragEnd}
              animate={{
                x: dragPosition.x,
                rotate: dragPosition.x * 0.03,
                scale: 1
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              exit={{ 
                x: dragPosition.x < 0 ? -500 : 500,
                opacity: 0,
                transition: { duration: 0.2 }
              }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.05 }}
            >
              <SwipeCard
                pair={currentPair}
                dragPosition={dragPosition}
                threshold={SWIPE_THRESHOLD}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SwipeActions onSwipe={handleSwipe} />
    </div>
  );
};

export default SwipeScreen;
