
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SwipeCard } from "@/components/SwipeCard";
import { SwipeActions } from "@/components/SwipeActions";
import { SwipeHeader } from "@/components/SwipeHeader";
import { MatchesList } from "@/components/MatchesList";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FriendPair = Database['public']['Tables']['friend_pairs']['Row'];

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMatches, setShowMatches] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<FriendPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPair, setCurrentPair] = useState<FriendPair | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    fetchCurrentPair();
    loadProfiles();
  }, []);

  const fetchCurrentPair = async () => {
    const currentPairId = localStorage.getItem('currentPairId');
    if (!currentPairId) {
      navigate('/city-selection');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friend_pairs')
        .select('*')
        .eq('id', currentPairId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCurrentPair(data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find your profile"
        });
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error fetching current pair:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your profile"
      });
    }
  };

  const loadProfiles = async () => {
    const currentPairId = localStorage.getItem('currentPairId');
    if (!currentPairId || !currentPair) return;

    try {
      // Get all pairs we haven't liked yet
      const { data: existingLikes } = await supabase
        .from('pair_likes')
        .select('to_pair_id')
        .eq('from_pair_id', currentPairId);

      const likedPairIds = existingLikes?.map(like => like.to_pair_id) || [];

      // Get potential matches
      const { data: newProfiles, error } = await supabase
        .from('friend_pairs')
        .select('*')
        .neq('id', currentPairId)
        .eq('city', localStorage.getItem('selectedCity') || 'NYC')
        .neq('gender', currentPair.gender) // Only show opposite gender pairs
        .not('id', 'in', `(${likedPairIds.join(',')})`)
        .limit(10);

      if (error) throw error;
      setProfiles(newProfiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load potential matches"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewCode = async () => {
    if (!currentPair?.id) return;

    try {
      const code = `CREW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from('pair_referrals')
        .insert({
          referral_code: code,
          inviter_pair_id: currentPair.id
        });

      if (error) throw error;

      setReferralCode(code);
      setReferralCopied(false);
      
      toast({
        title: "New code generated!",
        description: "Share this code with your friends"
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate referral code"
      });
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentPair || !profiles[currentIndex]) return;

    if (direction === 'right') {
      // Record the like
      const swipedProfile = profiles[currentIndex];
      try {
        const { error } = await supabase
          .from('pair_likes')
          .insert({
            from_pair_id: currentPair.id,
            to_pair_id: swipedProfile.id
          });

        if (error) throw error;

        // Check for a match (the trigger will handle creating the match)
        const { data: matches, error: matchError } = await supabase
          .from('pair_matches')
          .select('*')
          .or(`pair1_id.eq.${currentPair.id},pair2_id.eq.${currentPair.id}`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (matchError) throw matchError;

        // If we found a new match with the swiped profile
        if (matches && matches.length > 0) {
          const match = matches[0];
          if (match.pair1_id === swipedProfile.id || match.pair2_id === swipedProfile.id) {
            toast({
              title: "It's a match! 🎉",
              description: "Start chatting with your new match!",
              action: (
                <Button onClick={() => navigate('/chat', { 
                  state: { 
                    matchId: match.id,
                    currentPairId: currentPair.id,
                    otherPairId: match.pair1_id === currentPair.id ? match.pair2_id : match.pair1_id,
                    otherPairNames: `${swipedProfile.user1_email} & ${swipedProfile.user2_email}`
                  }
                })}>
                  Open Chat
                </Button>
              )
            });
          }
        }
      } catch (error) {
        console.error('Error recording like:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record like"
        });
      }
    }

    // Move to next profile
    if (currentIndex >= profiles.length - 1) {
      await loadProfiles();
      setCurrentIndex(0);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SwipeHeader
        referralCode={referralCode}
        referralCopied={referralCopied}
        generateNewCode={generateNewCode}
        onChatClick={() => setShowMatches(true)}
      />

      <div className="flex-1 relative">
        {showMatches ? (
          <div className="absolute inset-0 bg-black">
            <div className="flex items-center p-4 border-b border-white/10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMatches(false)}
                className="text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h2 className="text-white text-lg ml-2">Your Matches</h2>
            </div>
            {currentPair && (
              <MatchesList 
                currentPairId={currentPair.id}
                onClose={() => setShowMatches(false)}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 relative p-4">
              {profiles.length > 0 ? (
                <div className="h-full">
                  {profiles.map((profile, index) => (
                    index === currentIndex && (
                      <SwipeCard
                        key={profile.id}
                        pair={{
                          id: profile.id,
                          names: `${profile.user1_email.split('@')[0]} & ${profile.user2_email.split('@')[0]}`,
                          ages: profile.gender === 'M' ? 'Male Pair' : 'Female Pair',
                          bio: profile.bio || 'No bio yet',
                          image: profile.photo1_url || '/placeholder.svg'
                        }}
                        dragPosition={{ x: 0, y: 0 }}
                        threshold={100}
                      />
                    )
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white text-center">
                    No more profiles to show.<br />
                    Check back later!
                  </p>
                </div>
              )}
            </div>
            {profiles.length > 0 && (
              <SwipeActions onSwipe={handleSwipe} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
