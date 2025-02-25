
export const SWIPE_THRESHOLD = 100;

export type SwipeDirection = 'like' | 'pass';

export interface Pair {
  id: number;
  names: string;
  ages: string;
  bio: string;
  image: string;
}

export const mockPairs: Pair[] = [
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
