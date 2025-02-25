
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SwipeDirection } from "@/utils/swipeUtils";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type FriendPair = Database['public']['Tables']['friend_pairs']['Row'];
type Match = {
  id: string;
  created_at: string;
  pair1_id: string;
  pair2_id: string;
  status: string;
  pair1?: FriendPair;
  pair2?: FriendPair;
};

export const useSwipeLogic = (currentPairId: string) => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [swipedPairs, setSwipedPairs] = useState<{ [key: number]: SwipeDirection }>({});
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [latestMatch, setLatestMatch] = useState<Match | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSwipe = async (direction: SwipeDirection, swipedPair: any, totalPairs: number) => {
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
            to_pair_id: `other-${swipedPair.id}`
          });

        if (likeError) throw likeError;

        const { data: matchData, error: matchError } = await supabase
          .from('pair_matches')
          .select(`
            *,
            pair1:friend_pairs!pair_matches_pair1_id_fkey(*),
            pair2:friend_pairs!pair_matches_pair2_id_fkey(*)
          `)
          .or(`and(pair1_id.eq.${currentPairId},pair2_id.eq.other-${swipedPair.id}),and(pair1_id.eq.other-${swipedPair.id},pair2_id.eq.${currentPairId})`)
          .maybeSingle();

        if (matchError) throw matchError;

        if (matchData) {
          setLatestMatch(matchData as Match);
          toast({
            title: "It's a match! 🎉",
            description: "Start chatting with your new match!",
            action: (
              <Button 
                onClick={() => navigate('/chat', { 
                  state: { 
                    matchId: matchData.id,
                    currentPairId,
                    otherPairId: matchData.pair1_id === currentPairId ? matchData.pair2_id : matchData.pair1_id
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

    if (currentPairIndex < totalPairs - 1) {
      setCurrentPairIndex(prev => prev + 1);
      setDragPosition({ x: 0, y: 0 });
    }
  };

  return {
    currentPairIndex,
    swipedPairs,
    dragPosition,
    setDragPosition,
    latestMatch,
    handleSwipe
  };
};
