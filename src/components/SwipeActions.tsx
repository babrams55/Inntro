
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { SwipeDirection } from "@/utils/swipeUtils";

interface SwipeActionsProps {
  onSwipe: (direction: SwipeDirection) => void;
}

export const SwipeActions = ({ onSwipe }: SwipeActionsProps) => {
  return (
    <div className="p-6 flex justify-center gap-4">
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-16 rounded-full border-red-500 text-red-500 hover:bg-red-500/10"
        onClick={() => onSwipe('pass')}
      >
        <X className="h-8 w-8" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-16 rounded-full border-green-500 text-green-500 hover:bg-green-500/10"
        onClick={() => onSwipe('like')}
      >
        <Heart className="h-8 w-8" />
      </Button>
    </div>
  );
};
