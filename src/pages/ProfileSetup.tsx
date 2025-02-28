
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, User, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [email, setEmail] = useState("");
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

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
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
    if (!email || !photo) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please enter your email and upload a photo",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
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
      if (step === 1) {
        // Create a partial profile for User 1
        const { data: profile, error: profileError } = await supabase
          .from('friend_pairs')
          .insert({
            user1_email: email,
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
            user2_email: email,
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
    <div className="min-h-screen flex flex-col items-center justify-between bg-black pb-8">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold mb-2 text-white text-center">
          {step === 1 ? "Create Your Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          {step === 1 ? "Tell us about yourself" : "You've been invited to join Inntro"}
        </p>

        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="w-32 h-32 rounded-full bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden mb-3"
              style={{
                backgroundImage: photoPreview ? `url(${photoPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!photoPreview && (
                <div className="text-center p-4">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">Your photo</span>
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10 text-sm"
              >
                {photoPreview ? "Change Photo" : "Upload Headshot"}
              </Button>
            </label>
          </div>

          {/* Email Input */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900 border-transparent text-white placeholder:text-white/70 pl-10"
            />
          </div>

          {/* Gender Selection */}
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-gray-900 border-transparent text-white">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
            </SelectContent>
          </Select>

          {/* Venue Selection */}
          <div className="space-y-2">
            <p className="text-white text-sm font-medium mb-2">Select 3 venues you'd like to visit:</p>
            <div className="grid grid-cols-1 gap-2">
              {VENUE_OPTIONS.map((venue) => (
                <div 
                  key={venue}
                  onClick={() => toggleVenue(venue)}
                  className={`
                    p-3 rounded-md cursor-pointer flex items-center justify-between
                    ${selectedVenues.includes(venue) 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                  `}
                >
                  <span>{venue}</span>
                  {selectedVenues.includes(venue) && (
                    <CheckCircle className="h-5 w-5 text-white" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-1">
              {selectedVenues.length}/3 selected
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={loading || !email || !photo || !gender || selectedVenues.length < 3}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-2 flex items-center"
      >
        {loading ? "Processing..." : (step === 1 ? "Continue" : "Complete Profile")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProfileSetup;
