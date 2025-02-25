
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { SwipeCard } from "@/components/SwipeCard";
import { SWIPE_THRESHOLD } from "@/utils/swipeUtils";

interface SwipeCardContainerProps {
  currentPair: any;
  dragPosition: { x: number; y: number };
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

export const SwipeCardContainer = ({ 
  currentPair, 
  dragPosition, 
  onDragEnd 
}: SwipeCardContainerProps) => {
  return (
    <AnimatePresence mode="wait">
      {currentPair && (
        <motion.div
          key={currentPair.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragSnapToOrigin={true}
          onDragEnd={onDragEnd}
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
          <SwipeCard
            pair={currentPair}
            dragPosition={dragPosition}
            threshold={SWIPE_THRESHOLD}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
