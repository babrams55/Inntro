import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

// Temporary mock data - this would come from your backend
const mockPairs = [
  {
    id: 1,
    names: "Mia & Zoe",
    ages: "25 & 27",
    bio: "Love pizza and dive bars",
    image: "/placeholder.svg"
  },
  {
    id: 2,
    names: "Emma & Sarah",
    ages: "26 & 24",
    bio: "Hiking enthusiasts and coffee addicts",
    image: "/placeholder.svg"
  }
];

const SWIPE_THRESHOLD = 100; // minimum distance for a swipe

const SwipeScreen = () => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [swipedPairs, setSwipedPairs] = useState<{ [key: number]: 'like' | 'pass' }>({});
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSwipe = (direction: 'like' | 'pass') => {
    setSwipedPairs(prev => ({
      ...prev,
      [mockPairs[currentPairIndex].id]: direction
    }));

    // Simulate a match 50% of the time when liking
    if (direction === 'like' && Math.random() > 0.5) {
      const pair = mockPairs[currentPairIndex];
      toast({
        title: "It's a match! 🎉",
        description: `Start chatting with ${pair.names}!`,
        duration: 5000,
        action: {
          label: "Open Chat",
          onClick: () => navigate('/chat')
        }
      });
    }

    // Move to next pair
    if (currentPairIndex < mockPairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
      setDragPosition({ x: 0, y: 0 });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      handleSwipe(info.offset.x > 0 ? 'like' : 'pass');
    } else {
      setDragPosition({ x: 0, y: 0 }); // Reset position if not swiped far enough
    }
  };

  const currentPair = mockPairs[currentPairIndex];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Navigation */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-white text-xl font-bold text-center">Find Your Double Date</h1>
      </div>

      {/* Swipe Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {currentPair && (
            <motion.div
              key={currentPair.id}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragSnapToOrigin={true}
              onDragEnd={handleDragEnd}
              animate={{
                x: dragPosition.x,
                rotate: dragPosition.x * 0.03,
                scale: 1
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              exit={{ 
                x: dragPosition.x < 0 ? -500 : 500,
                opacity: 0,
                transition: { duration: 0.2 }
              }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.05 }}
            >
              <div className="aspect-[3/4] relative bg-gray-800">
                <img
                  src={currentPair.image}
                  alt={currentPair.names}
                  className="w-full h-full object-cover"
                  draggable="false"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-white text-2xl font-bold">{currentPair.names}</h2>
                  <p className="text-gray-300">{currentPair.ages}</p>
                  <p className="text-gray-400 mt-2">{currentPair.bio}</p>
                </div>

                {/* Swipe Indicators */}
                <motion.div
                  className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full font-bold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: dragPosition.x > SWIPE_THRESHOLD ? 1 : 0,
                    scale: dragPosition.x > SWIPE_THRESHOLD ? 1 : 0.8
                  }}
                >
                  LIKE
                </motion.div>
                <motion.div
                  className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full font-bold"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: dragPosition.x < -SWIPE_THRESHOLD ? 1 : 0,
                    scale: dragPosition.x < -SWIPE_THRESHOLD ? 1 : 0.8
                  }}
                >
                  PASS
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="p-6 flex justify-center gap-4">
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-red-500 text-red-500 hover:bg-red-500/10"
          onClick={() => handleSwipe('pass')}
        >
          <X className="h-8 w-8" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-green-500 text-green-500 hover:bg-green-500/10"
          onClick={() => handleSwipe('like')}
        >
          <Heart className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};

export default SwipeScreen;
