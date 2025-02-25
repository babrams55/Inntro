
import { useState, useEffect } from "react";
import { PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SwipeHeader } from "@/components/SwipeHeader";
import { SwipeCardContainer } from "@/components/SwipeCardContainer";
import { SwipeActions } from "@/components/SwipeActions";
import { MatchesList } from "@/components/MatchesList";
import { useSwipeLogic } from "@/hooks/useSwipeLogic";
import { SWIPE_THRESHOLD, getMatchingPairs, Gender } from "@/utils/swipeUtils";

const SwipeScreen = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const navigate = useNavigate();

  const userGender: Gender = "M";
  const currentPairId = "pair-id"; // TODO: Get this from auth context
  const filteredPairs = getMatchingPairs(userGender);

  const {
    currentPairIndex,
    dragPosition,
    setDragPosition,
    latestMatch,
    handleSwipe
  } = useSwipeLogic(currentPairId);

  const generateNewCode = async () => {
    try {
      const newCode = `CODE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setReferralCode(newCode);
      setReferralCopied(false);
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      handleSwipe(
        info.offset.x > 0 ? 'like' : 'pass',
        filteredPairs[currentPairIndex],
        filteredPairs.length
      );
    } else {
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const navigateToLatestChat = () => {
    if (!latestMatch || !latestMatch.pair1 || !latestMatch.pair2) return;

    const otherPair = latestMatch.pair1_id === currentPairId 
      ? latestMatch.pair2
      : latestMatch.pair1;

    navigate('/chat', {
      state: {
        matchId: latestMatch.id,
        currentPairId,
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
        onChatClick={() => setShowMatches(true)}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <SwipeCardContainer
          currentPair={currentPair}
          dragPosition={dragPosition}
          onDragEnd={handleDragEnd}
        />
      </div>

      <SwipeActions 
        onSwipe={(direction) => handleSwipe(direction, currentPair, filteredPairs.length)} 
      />

      {showMatches && (
        <MatchesList 
          currentPairId={currentPairId} 
          onClose={() => setShowMatches(false)} 
        />
      )}
    </div>
  );
};

export default SwipeScreen;
