
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle, Mail, User, ArrowRight, Instagram } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [email, setEmail] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [instagramValid, setInstagramValid] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [sentInvite, setSentInvite] = useState(false);

  // Check if we're arriving with a referral code from a friend
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralCode = params.get('code') || localStorage.getItem('referralCode');
    
    if (referralCode) {
      // We're User 2, skip to step 2 and load friend's info
      setStep(2);
      // We would load the friend's info here
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

  const validateInstagram = (handle: string) => {
    // Instagram usernames can contain letters, numbers, periods and underscores
    // and must be between 1 and 30 characters
    if (!handle) return true; // Optional field
    
    const instagramRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
    return instagramRegex.test(handle);
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove @ if user included it
    const cleanValue = value.startsWith('@') ? value.substring(1) : value;
    setInstagram(cleanValue);
    
    if (cleanValue) {
      setInstagramValid(validateInstagram(cleanValue));
    } else {
      setInstagramValid(null); // No validation for empty field
    }
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

    if (step === 1 && friendEmail && !validateEmail(friendEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid friend email",
        description: "Please enter a valid email address for your friend",
      });
      return;
    }

    if (instagram && !validateInstagram(instagram)) {
      toast({
        variant: "destructive",
        title: "Invalid Instagram handle",
        description: "Please enter a valid Instagram username",
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
            user2_email: friendEmail || 'pending',
            gender: gender || 'pending',
            bio: bio || null,
            instagram: instagram || null,
            city: "pending",
            status: friendEmail ? 'pending_friend' : 'pending_invite'
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
        
        // If friend email is provided, send an invite
        if (friendEmail) {
          await sendInviteToFriend(profile.id);
        }
        
        // Move to next step or finish
        if (friendEmail) {
          setSentInvite(true);
          // Wait here for friend to join
        } else {
          // Go to invite friend page to send invitation later
          navigate("/crew-invite");
        }
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
          ? (friendEmail ? "Invitation sent to your friend." : "Let's invite your friend now.") 
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
  
  const sendInviteToFriend = async (pairId: string) => {
    try {
      // Generate a unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Store the referral
      const { data, error } = await supabase
        .from('pair_referrals')
        .insert({
          inviter_pair_id: pairId,
          referral_code: code,
          used: false
        });
        
      if (error) throw error;
      
      // Send the invite via the edge function
      await supabase.functions.invoke("send-referral", {
        body: { email: friendEmail, referralCode: code }
      });
      
      return code;
    } catch (error) {
      console.error("Error sending invite:", error);
      throw error;
    }
  };

  if (sentInvite) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Mail className="h-16 w-16 text-blue-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">Invitation Sent!</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          We've sent an invitation to {friendEmail}. Once they join, you'll both be connected automatically.
        </p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-black pb-8">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold mb-2 text-white text-center">
          {step === 1 ? "Create Your Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          {step === 1 ? "Sign up with your email and photo" : "You've been invited to join Inntro"}
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

          {/* Email */}
          <div className="space-y-4">
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

            {step === 1 && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Your friend's email (optional)"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="bg-gray-900 border-transparent text-white placeholder:text-white/70 pl-10"
                />
              </div>
            )}
          </div>

          {/* Optional Fields - Only show if expanded or in step 2 */}
          <div className="space-y-4">
            <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
              <SelectTrigger className="w-full bg-gray-900 border-transparent text-white">
                <SelectValue placeholder="Gender (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
                <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Instagram handle (without @)"
                value={instagram}
                onChange={handleInstagramChange}
                className={`bg-gray-900 border-transparent text-white placeholder:text-white/70 pl-10 ${
                  instagramValid === false ? "border-red-500" : 
                  instagramValid === true ? "border-green-500" : ""
                }`}
              />
              {instagramValid === false && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid Instagram handle</p>
              )}
              {instagram && instagramValid && (
                <div className="mt-2 p-3 bg-gray-800 rounded-md flex items-center space-x-2">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span className="text-white">@{instagram}</span>
                </div>
              )}
            </div>

            <Textarea
              placeholder="Write a short bio (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-gray-900 border-transparent text-white placeholder:text-white/70 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={loading || !email || !photo || instagramValid === false}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-2 flex items-center"
      >
        {loading ? "Processing..." : (step === 1 ? "Continue" : "Complete Profile")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProfileSetup;
