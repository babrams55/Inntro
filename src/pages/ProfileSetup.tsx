
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Chicago venue options
const VENUE_OPTIONS = [
  "Good Night John Boy",
  "Ranalli's Lincoln Park",
  "Halligans",
  "Kirkwood",
  "Happy Camper"
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  // Check if we're arriving with a referral code from a friend
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('code') || localStorage.getItem('referralCode');
    
    if (referralCode) {
      // We're User 2, skip to step 2 and load friend's info
      setStep(2);
    }
  }, [location]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleVenue = (venue: string) => {
    setSelectedVenues(prev => {
      // If already selected, remove it
      if (prev.includes(venue)) {
        return prev.filter(v => v !== venue);
      }
      
      // If we already have 3 selections, don't add more
      if (prev.length >= 3) {
        return prev;
      }
      
      // Add the new venue
      return [...prev, venue];
    });
  };

  const handleContinue = async () => {
    if (!photo) {
      toast({
        variant: "destructive",
        title: "Photo required",
        description: "Please upload a photo to continue",
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: "Gender required",
        description: "Please select your gender",
      });
      return;
    }

    if (selectedVenues.length < 3) {
      toast({
        variant: "destructive",
        title: "Venue selection required",
        description: "Please select 3 venues you'd like to visit",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user email from local storage or query params
      // In a real app, you would retrieve this from your auth system
      const userEmail = localStorage.getItem('userEmail') || '';
      
      if (!userEmail) {
        toast({
          variant: "destructive",
          title: "User email not found",
          description: "Please return to the access request page",
        });
        setLoading(false);
        return;
      }
      
      if (step === 1) {
        // Create a partial profile for User 1
        const { data: profile, error: profileError } = await supabase
          .from('friend_pairs')
          .insert({
            user1_email: userEmail,
            user2_email: 'pending',
            gender: gender,
            venue_preferences: selectedVenues,
            city: "Chicago", // Default to Chicago for now
            status: 'pending_invite'
          })
          .select()
          .single();

        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw profileError;
        }

        console.log("Created profile:", profile);
        
        // Upload photo to Supabase storage
        if (photo) {
          const fileName = `profile_${profile.id}_user1.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(fileName, photo);
            
          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
            // Continue despite upload error
          } else {
            // Get the photo URL
            const photoUrl = supabase.storage.from('profile-photos').getPublicUrl(fileName).data.publicUrl;
            
            // Update the profile with the photo URL
            await supabase
              .from('friend_pairs')
              .update({ photo1_url: photoUrl })
              .eq('id', profile.id);
          }
        }
        
        // Go to invite friend page to send invitation
        navigate("/crew-invite");
      } else if (step === 2) {
        // User 2 flow - complete the pair
        const referralCode = localStorage.getItem('referralCode');
        if (!referralCode) {
          toast({
            variant: "destructive",
            title: "Missing referral code",
            description: "Cannot connect to your friend's profile"
          });
          return;
        }
        
        // Get the referral
        const { data: referral, error: referralError } = await supabase
          .from('pair_referrals')
          .select('inviter_pair_id')
          .eq('referral_code', referralCode)
          .single();
          
        if (referralError || !referral) {
          toast({
            variant: "destructive",
            title: "Invalid referral",
            description: "Could not find your friend's profile"
          });
          return;
        }
        
        // Update the friend pair with User 2's info
        const { error: updateError } = await supabase
          .from('friend_pairs')
          .update({ 
            user2_email: userEmail,
            user2_venue_preferences: selectedVenues,
            status: 'active'
          })
          .eq('id', referral.inviter_pair_id);
          
        if (updateError) {
          console.error("Error updating profile:", updateError);
          throw updateError;
        }
        
        // Upload photo to Supabase storage
        if (photo) {
          const fileName = `profile_${referral.inviter_pair_id}_user2.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(fileName, photo);
            
          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
            // Continue despite upload error
          } else {
            // Get the photo URL
            const photoUrl = supabase.storage.from('profile-photos').getPublicUrl(fileName).data.publicUrl;
            
            // Update the profile with the photo URL
            await supabase
              .from('friend_pairs')
              .update({ photo2_url: photoUrl })
              .eq('id', referral.inviter_pair_id);
          }
        }
        
        // Mark the referral as used
        await supabase
          .from('pair_referrals')
          .update({ used: true, invitee_pair_id: referral.inviter_pair_id })
          .eq('referral_code', referralCode);
          
        // Go to city selection
        navigate("/city-selection");
      }
      
      toast({
        title: step === 1 ? "Profile created!" : "Profile completed!",
        description: step === 1 
          ? "Let's invite your friend now." 
          : "You've been connected with your friend!",
      });
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#0A0A0A] pb-8">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Your Resume
        </h1>
        <p className="text-pink-500 text-center mb-8">
          {step === 1 ? "Tell us about yourself" : "You've been invited to join Inntro"}
        </p>

        <div className="space-y-8">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="w-36 h-36 rounded-full bg-[#1A1A1A] border-2 border-dashed border-[#2A2A2A] flex items-center justify-center overflow-hidden mb-4 shadow-lg shadow-purple-500/10"
              style={{
                backgroundImage: photoPreview ? `url(${photoPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!photoPreview && (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-400">Your photo</span>
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "bg-transparent border-[#2A2A2A] text-white hover:bg-white/5 text-sm px-6",
                  "rounded-full transition-all duration-200"
                )}
              >
                {photoPreview ? "Change Photo" : "Upload Headshot"}
              </Button>
            </label>
          </div>

          {/* Gender Selection */}
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-[#1A1A1A] border-[#2A2A2A] text-white rounded-lg">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A]/95 border-[#2A2A2A]">
              <SelectItem value="M" className="text-white hover:bg-[#2A2A2A]">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-[#2A2A2A]">Female</SelectItem>
            </SelectContent>
          </Select>

          {/* Venue Selection Bubbles */}
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <h3 className="text-white text-xl font-medium mb-2">Where do you want to go?</h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Select 3 venues you'd like to visit
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {VENUE_OPTIONS.map((venue) => (
                  <div 
                    key={venue}
                    onClick={() => toggleVenue(venue)}
                    className={`
                      relative group cursor-pointer
                      transition-all duration-300 ease-in-out
                      ${selectedVenues.includes(venue) 
                        ? 'scale-105 z-10' 
                        : 'hover:scale-105'
                      }
                    `}
                  >
                    <div className={`
                      w-[120px] h-[120px] rounded-full 
                      flex items-center justify-center 
                      text-center p-4
                      transition-all duration-300
                      border-3
                      ${selectedVenues.includes(venue) 
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-purple-300 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:bg-[#252525]'
                      }
                    `}>
                      <span className="text-sm font-medium">{venue}</span>
                    </div>
                    
                    {selectedVenues.includes(venue) && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-md">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center space-x-2 mt-2">
                {[0, 1, 2].map((index) => (
                  <div 
                    key={index}
                    className={`
                      w-3 h-3 rounded-full transition-all duration-300
                      ${index < selectedVenues.length 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-110' 
                        : 'bg-[#2A2A2A]'
                      }
                    `}
                  />
                ))}
                <span className="ml-2 text-gray-400 text-sm">
                  {selectedVenues.length}/3 selected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={loading || !photo || !gender || selectedVenues.length < 3}
        className={cn(
          "bg-gradient-to-r from-blue-500 to-purple-500",
          "hover:from-blue-600 hover:to-purple-600 text-white font-medium",
          "rounded-full px-8 py-2 flex items-center shadow-lg shadow-purple-500/20"
        )}
      >
        {loading ? "Processing..." : (step === 1 ? "Continue" : "Complete Profile")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProfileSetup;
