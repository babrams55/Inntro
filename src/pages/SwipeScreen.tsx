
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const SwipeScreen = () => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [swipedPairs, setSwipedPairs] = useState<{ [key: number]: 'like' | 'pass' }>({});

  const handleSwipe = (direction: 'like' | 'pass') => {
    setSwipedPairs(prev => ({
      ...prev,
      [mockPairs[currentPairIndex].id]: direction
    }));

    // Simulate a match 50% of the time when liking
    if (direction === 'like' && Math.random() > 0.5) {
      // Show match notification
      console.log("It's a match!");
    }

    // Move to next pair
    if (currentPairIndex < mockPairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-gray-900 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="aspect-[3/4] relative bg-gray-800">
                <img
                  src={currentPair.image}
                  alt={currentPair.names}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 className="text-white text-2xl font-bold">{currentPair.names}</h2>
                  <p className="text-gray-300">{currentPair.ages}</p>
                  <p className="text-gray-400 mt-2">{currentPair.bio}</p>
                </div>
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
