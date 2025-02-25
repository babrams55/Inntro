
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [bio, setBio] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!photo || !bio) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please add a photo and bio before continuing",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Here you'll handle the photo upload and profile data storage
      // This is a placeholder for now - we'll implement the actual storage later
      console.log("Submitting profile:", {
        photo,
        bio,
        instagramHandle,
      });
      
      // Navigate to swipe screen after successful submission
      navigate("/swipe");
    } catch (error) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold mb-3 text-white text-center">Complete Your Profile</h1>
        <p className="text-gray-400 mb-8 text-center">
          Add a photo and some details about you and your partner
        </p>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div 
              className="w-48 h-48 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden mb-4"
              style={{
                backgroundImage: photoPreview ? `url(${photoPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!photoPreview && (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-400">Upload a photo of you both</span>
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </Button>
            </label>
          </div>

          <Textarea
            placeholder="Write a short bio about you both..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 min-h-[100px]"
          />

          <div className="relative">
            <Input
              type="text"
              placeholder="Instagram handle (optional)"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="bg-black/50 border-white/20 text-white placeholder:text-gray-500 pl-10"
            />
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !photo || !bio}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white"
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
