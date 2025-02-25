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
import type { Database } from "@/integrations/supabase/types";

type Match = Database['public']['Tables']['pair_matches']['Row'];

const SwipeScreen = () => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [swipedPairs, setSwipedPairs] = useState<{ [key: number]: SwipeDirection }>({});
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const userGender: Gender = "M";
  const currentPairId = "pair-id"; // TODO: Get this from auth context
  const filteredPairs = getMatchingPairs(userGender);

  useEffect(() => {
    const fetchLatestMatch = async () => {
      const { data, error } = await supabase
        .from('pair_matches')
        .select('*, pair1:pair1_id(*), pair2:pair2_id(*)')
        .or(`pair1_id.eq.${currentPairId},pair2_id.eq.${currentPairId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest match:', error);
      } else if (data) {
        setLatestMatch(data);
      }
    };

    fetchLatestMatch();
  }, [currentPairId]);

  const handleSwipe = async (direction: SwipeDirection) => {
    const swipedPair = filteredPairs[currentPairIndex];
    
    setSwipedPairs(prev => ({
      ...prev,
      [swipedPair.id]: direction
    }));

    if (direction === 'like') {
      try {
        const { error: likeError } = await supabase
          .from('pair_likes')
          .insert({
            from_pair_id: currentPairId,
            to_pair_id: `other-${swipedPair.id}` // TODO: Replace with actual pair ID
          });

        if (likeError) throw likeError;

        const { data: matchData, error: matchError } = await supabase
          .from('pair_matches')
          .select('*, pair1:pair1_id(*), pair2:pair2_id(*)')
          .or(`and(pair1_id.eq.${currentPairId},pair2_id.eq.other-${swipedPair.id}),and(pair1_id.eq.other-${swipedPair.id},pair2_id.eq.${currentPairId})`)
          .maybeSingle();

        if (matchError) throw matchError;

        if (matchData) {
          setLatestMatch(matchData);
          toast({
            title: "It's a match! 🎉",
            description: `Start chatting with ${swipedPair.names}!`,
            action: (
              <Button 
                onClick={() => navigate('/chat', { 
                  state: { 
                    matchId: matchData.id,
                    currentPairId,
                    otherPairNames: swipedPair.names,
                    otherPairId: `other-${swipedPair.id}` // TODO: Replace with actual pair ID
                  }
                })}
              >
                Open Chat
              </Button>
            )
          });
        }
      } catch (error) {
        console.error('Error handling like:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process your like"
        });
      }
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

  const navigateToLatestChat = () => {
    if (!latestMatch) return;

    const otherPair = latestMatch.pair1_id === currentPairId 
      ? latestMatch.pair2
      : latestMatch.pair1;

    navigate('/chat', {
      state: {
        matchId: latestMatch.id,
        currentPairId,
        otherPairNames: otherPair.names,
        otherPairId: otherPair.id
      }
    });
  };

  const currentPair = filteredPairs[currentPairIndex];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SwipeHeader
        referralCode={referralCode}
        referralCopied={referralCopied}
        generateNewCode={generateNewCode}
        onChatClick={navigateToLatestChat}
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
