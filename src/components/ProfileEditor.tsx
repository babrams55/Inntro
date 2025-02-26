
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileEditorProps {
  pairId: string;
  currentBio: string;
  photo1Url?: string;
  photo2Url?: string;
  onUpdate: () => void;
}

export function ProfileEditor({ pairId, currentBio, photo1Url, photo2Url, onUpdate }: ProfileEditorProps) {
  const [bio, setBio] = useState(currentBio);
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, photoNum: 1 | 2) => {
    if (e.target.files && e.target.files[0]) {
      if (photoNum === 1) {
        setPhoto1(e.target.files[0]);
      } else {
        setPhoto2(e.target.files[0]);
      }
    }
  };

  const uploadPhoto = async (file: File, photoNum: 1 | 2): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${pairId}-photo${photoNum}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updates: any = { bio };

      if (photo1) {
        updates.photo1_url = await uploadPhoto(photo1, 1);
      }
      if (photo2) {
        updates.photo2_url = await uploadPhoto(photo2, 2);
      }

      const { error } = await supabase
        .from('friend_pairs')
        .update(updates)
        .eq('id', pairId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label>Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourselves..."
            />
          </div>
          
          <div className="grid gap-2">
            <label>Your Photo</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoChange(e, 1)}
            />
            {photo1Url && (
              <img src={photo1Url} alt="Your photo" className="w-20 h-20 object-cover rounded" />
            )}
          </div>

          <div className="grid gap-2">
            <label>Friend's Photo</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoChange(e, 2)}
            />
            {photo2Url && (
              <img src={photo2Url} alt="Friend's photo" className="w-20 h-20 object-cover rounded" />
            )}
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
