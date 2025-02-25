
import { motion } from "framer-motion";
import { Pair } from "@/utils/swipeUtils";

interface SwipeCardProps {
  pair: Pair;
  dragPosition: { x: number; y: number };
  threshold: number;
}

export const SwipeCard = ({ pair, dragPosition, threshold }: SwipeCardProps) => {
  return (
    <div className="aspect-[3/4] relative bg-gray-800">
      <img
        src={pair.image}
        alt={pair.names}
        className="w-full h-full object-cover"
        draggable="false"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <h2 className="text-white text-2xl font-bold">{pair.names}</h2>
        <p className="text-gray-300">{pair.ages}</p>
        <p className="text-gray-400 mt-2">{pair.bio}</p>
      </div>

      <motion.div
        className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full font-bold"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: dragPosition.x > threshold ? 1 : 0,
          scale: dragPosition.x > threshold ? 1 : 0.8
        }}
      >
        LIKE
      </motion.div>
      <motion.div
        className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full font-bold"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: dragPosition.x < -threshold ? 1 : 0,
          scale: dragPosition.x < -threshold ? 1 : 0.8
        }}
      >
        PASS
      </motion.div>
    </div>
  );
};
