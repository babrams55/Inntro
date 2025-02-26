import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { SwipeActions } from "@/components/SwipeActions";
import { SwipeHeader } from "@/components/SwipeHeader";
import { MatchesList } from "@/components/MatchesList";
import { ProfileEditor } from "@/components/ProfileEditor";
import { supabase } from "@/integrations/supabase/client";

const SwipeScreen = () => {
  const navigate = useNavigate();
  const [showMatches, setShowMatches] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    fetchCurrentProfile();
    loadProfiles();
    generateNewCode();
  }, []);

  const fetchCurrentProfile = async () => {
    const currentPairId = localStorage.getItem('currentPairId');
    if (!currentPairId) {
      navigate('/');
      return;
    }

    const { data, error } = await supabase
      .from('friend_pairs')
      .select('*')
      .eq('id', currentPairId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setCurrentProfile(data);
  };

  const loadProfiles = async () => {
    setLoading(true);
    const currentPairId = localStorage.getItem('currentPairId');
    if (!currentPairId) {
      console.error('No pair ID found');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friend_pairs')
        .select('*')
        .neq('id', currentPairId)
        .eq('city', localStorage.getItem("selectedCity") || "NYC")
        .limit(10);

      if (error) throw error;

      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading profiles:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'right' | 'left') => {
    if (!currentProfile) return;

    const swipedProfile = profiles[currentIndex];
    if (!swipedProfile) return;

    if (direction === 'right') {
      // Record the like
      const { error } = await supabase
        .from('pair_likes')
        .insert([{ from_pair_id: currentProfile.id, to_pair_id: swipedProfile.id }]);

      if (error) {
        console.error("Error recording like:", error);
        return;
      }

      // Check for a mutual like (match)
      const { data: existingLike, error: matchError } = await supabase
        .from('pair_likes')
        .select('*')
        .eq('from_pair_id', swipedProfile.id)
        .eq('to_pair_id', currentProfile.id)
        .single();

      if (matchError) {
        console.error("Error checking for match:", matchError);
        return;
      }

      if (existingLike) {
        // Create a match
        const { error: createMatchError } = await supabase
          .from('pair_matches')
          .insert([{ pair1_id: currentProfile.id, pair2_id: swipedProfile.id, status: 'active' }]);

        if (createMatchError) {
          console.error("Error creating match:", createMatchError);
          return;
        }
      }
    }

    // Move to the next profile
    const nextIndex = currentIndex + 1;
    if (nextIndex < profiles.length) {
      setCurrentIndex(nextIndex);
    } else {
      // Optionally, reload profiles or indicate no more profiles
      loadProfiles();
      setCurrentIndex(0);
    }
  };

  const generateNewCode = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setReferralCode(newCode);
  
    const currentPairId = localStorage.getItem('currentPairId');
    if (!currentPairId) {
      console.error('No pair ID found');
      return;
    }
  
    const { data: existingReferral, error: selectError } = await supabase
      .from('pair_referrals')
      .select('*')
      .eq('inviter_pair_id', currentPairId)
      .eq('used', false)
      .single();
  
    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Error checking existing referral:", selectError);
      return;
    }
  
    if (existingReferral) {
      setReferralCode(existingReferral.referral_code);
      return;
    }
  
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);
  
    const { error: insertError } = await supabase
      .from('pair_referrals')
      .insert([{ inviter_pair_id: currentPairId, referral_code: newCode, expires_at: expires_at.toISOString(), used: false }]);
  
    if (insertError) {
      console.error("Error creating referral code:", insertError);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SwipeHeader
        referralCode={referralCode}
        referralCopied={referralCopied}
        generateNewCode={generateNewCode}
        onChatClick={() => setShowMatches(true)}
      />
      
      {/* Profile Editor Section */}
      {currentProfile && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {currentProfile.photo1_url && (
                  <img 
                    src={currentProfile.photo1_url} 
                    alt="Your photo" 
                    className="w-10 h-10 rounded-full border-2 border-black"
                  />
                )}
                {currentProfile.photo2_url && (
                  <img 
                    src={currentProfile.photo2_url} 
                    alt="Friend's photo" 
                    className="w-10 h-10 rounded-full border-2 border-black"
                  />
                )}
              </div>
              <div className="text-white text-sm truncate max-w-[200px]">
                {currentProfile.bio || "Add a bio..."}
              </div>
            </div>
            <ProfileEditor
              pairId={currentProfile.id}
              currentBio={currentProfile.bio || ""}
              photo1Url={currentProfile.photo1_url}
              photo2Url={currentProfile.photo2_url}
              onUpdate={fetchCurrentProfile}
            />
          </div>
        </div>
      )}

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
            <MatchesList onClose={() => setShowMatches(false)} />
          </div>
        ) : (
          <>
            {profiles.length > 0 && (
              <div className="relative h-full p-4">
                {profiles.map((profile, index) => (
                  <SwipeCard
                    key={profile.id}
                    profile={profile}
                    isActive={index === currentIndex}
                  />
                ))}
                <SwipeActions
                  onSwipe={(direction) => handleSwipe(direction)}
                  disabled={loading || profiles.length === 0}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SwipeScreen;
