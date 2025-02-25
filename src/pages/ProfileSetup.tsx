
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Upload, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo1Preview, setPhoto1Preview] = useState<string>("");
  const [photo2Preview, setPhoto2Preview] = useState<string>("");
  const [bio, setBio] = useState("");
  const [instagram1Handle, setInstagram1Handle] = useState("");
  const [instagram2Handle, setInstagram2Handle] = useState("");
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, photoNum: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (photoNum === 1) {
        setPhoto1(file);
        setPhoto1Preview(URL.createObjectURL(file));
      } else {
        setPhoto2(file);
        setPhoto2Preview(URL.createObjectURL(file));
      }
    }
  };

  const handleInstagramClick = (handle: string) => {
    if (handle) {
      const cleanHandle = handle.replace('@', '');
      window.open(`https://instagram.com/${cleanHandle}`, '_blank');
    }
  };

  const handleSubmit = async () => {
    if (!photo1 || !photo2 || !bio || !email1 || !email2 || !gender) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in all required fields before continuing",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Create the friend pair in the database
      const { data: friendPair, error: friendPairError } = await supabase
        .from('friend_pairs')
        .insert({
          user1_email: email1,
          user2_email: email2,
          gender,
          bio,
          status: 'active'
        })
        .select()
        .single();

      if (friendPairError) {
        throw friendPairError;
      }

      // TODO: Handle photo uploads to storage when configured
      console.log("Created friend pair:", friendPair);
      
      toast({
        title: "Profile created!",
        description: "Your profile has been set up successfully.",
      });

      // Navigate to swipe screen after successful submission
      navigate("/swipe");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isComplete = photo1 && photo2 && bio.trim().length > 0 && email1 && email2 && gender;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-black pb-8">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold mb-3 text-white text-center">Complete Your Profile</h1>
        <p className="text-gray-400 mb-8 text-center">
          Set up your profile with your friend
        </p>

        <div className="space-y-6">
          {/* Gender Selection */}
          <Select value={gender} onValueChange={(value: "M" | "F") => setGender(value)}>
            <SelectTrigger className="w-full bg-gray-900 border-transparent text-white">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20">
              <SelectItem value="M" className="text-white hover:bg-white/10">Male</SelectItem>
              <SelectItem value="F" className="text-white hover:bg-white/10">Female</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-4">
              {/* First Person */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-36 h-36 rounded-full bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden mb-2"
                  style={{
                    backgroundImage: photo1Preview ? `url(${photo1Preview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!photo1Preview && (
                    <div className="text-center p-4">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                      <span className="text-xs text-gray-400">Your photo</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, 1)}
                  className="hidden"
                  id="photo-upload-1"
                />
                <label htmlFor="photo-upload-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 text-sm"
                  >
                    {photo1Preview ? "Change Photo" : "Upload Photo"}
                  </Button>
                </label>
              </div>

              {/* Second Person */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-36 h-36 rounded-full bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden mb-2"
                  style={{
                    backgroundImage: photo2Preview ? `url(${photo2Preview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!photo2Preview && (
                    <div className="text-center p-4">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                      <span className="text-xs text-gray-400">Friend's photo</span>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e, 2)}
                  className="hidden"
                  id="photo-upload-2"
                />
                <label htmlFor="photo-upload-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 text-sm"
                  >
                    {photo2Preview ? "Change Photo" : "Upload Photo"}
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Email inputs */}
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Your email"
              value={email1}
              onChange={(e) => setEmail1(e.target.value)}
              className="bg-gray-900 border-transparent text-white placeholder:text-white/70"
            />
            <Input
              type="email"
              placeholder="Your friend's email"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              className="bg-gray-900 border-transparent text-white placeholder:text-white/70"
            />
          </div>

          <Textarea
            placeholder="Write a short bio about you both..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="bg-gray-900 border-transparent text-white placeholder:text-white/70 min-h-[100px]"
          />

          <div className="space-y-3">
            {/* Instagram Handles */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Your Instagram handle"
                value={instagram1Handle}
                onChange={(e) => setInstagram1Handle(e.target.value)}
                className="bg-gray-900 border-transparent text-white placeholder:text-white/70 pl-10"
                onClick={() => instagram1Handle && handleInstagramClick(instagram1Handle)}
              />
              <Instagram 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                onClick={() => instagram1Handle && handleInstagramClick(instagram1Handle)}
              />
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="Friend's Instagram handle"
                value={instagram2Handle}
                onChange={(e) => setInstagram2Handle(e.target.value)}
                className="bg-gray-900 border-transparent text-white placeholder:text-white/70 pl-10"
                onClick={() => instagram2Handle && handleInstagramClick(instagram2Handle)}
              />
              <Instagram 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                onClick={() => instagram2Handle && handleInstagramClick(instagram2Handle)}
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !isComplete}
        size="icon"
        className={`rounded-full w-16 h-16 transition-all duration-300 ${
          isComplete 
            ? 'bg-green-500 hover:bg-green-400 scale-100 opacity-100' 
            : 'bg-gray-700 scale-90 opacity-50'
        }`}
      >
        <CheckCircle className={`w-8 h-8 ${isComplete ? 'text-white' : 'text-gray-400'}`} />
      </Button>
    </div>
  );
};

export default ProfileSetup;
