
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FriendPair = Database['public']['Tables']['friend_pairs']['Row'];

interface Match {
  id: string;
  created_at: string;
  pair1_id: string;
  pair2_id: string;
  status: string;
  pair1?: FriendPair;
  pair2?: FriendPair;
}

interface MatchesListProps {
  currentPairId: string;
  onClose: () => void;
}

export const MatchesList = ({ currentPairId, onClose }: MatchesListProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      // Validate that currentPairId is a valid UUID before querying
      if (!currentPairId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentPairId)) {
        console.error("Invalid pair ID format:", currentPairId);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pair_matches')
        .select(`
          *,
          pair1:friend_pairs!pair_matches_pair1_id_fkey(*),
          pair2:friend_pairs!pair_matches_pair2_id_fkey(*)
        `)
        .or(`pair1_id.eq.${currentPairId},pair2_id.eq.${currentPairId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
      } else if (data) {
        setMatches(data);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [currentPairId]);

  const getPairNames = (match: Match) => {
    const otherPair = match.pair1_id === currentPairId ? match.pair2 : match.pair1;
    if (!otherPair) return "Unknown pair";
    return `${otherPair.user1_email.split('@')[0]} & ${otherPair.user2_email.split('@')[0]}`;
  };

  const navigateToChat = (match: Match) => {
    const otherPair = match.pair1_id === currentPairId ? match.pair2 : match.pair1;
    if (!otherPair) return;

    navigate('/chat', {
      state: {
        matchId: match.id,
        currentPairId,
        otherPairNames: getPairNames(match),
        otherPairId: otherPair.id
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-white">Your Matches</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading matches...
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 p-4 text-center">
              <Users className="h-8 w-8 mb-2 opacity-50" />
              <p>No matches yet. Keep swiping to find your perfect duo match!</p>
            </div>
          ) : (
            <div className="p-2">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => navigateToChat(match)}
                  className="w-full p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors mb-2 text-left flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{getPairNames(match)}</h3>
                    <p className="text-sm text-gray-400">
                      Matched {new Date(match.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
