
export const SWIPE_THRESHOLD = 100;

export type SwipeDirection = 'like' | 'pass';
export type Gender = 'M' | 'F';

export interface Pair {
  id: number;
  names: string;
  ages: string;
  bio: string;
  image: string;
  gender: Gender;
}

export const mockPairs: Pair[] = [
  {
    id: 1,
    names: "Mia & Zoe",
    ages: "25 & 27",
    bio: "Love pizza and dive bars",
    image: "/placeholder.svg",
    gender: "F"
  },
  {
    id: 2,
    names: "Emma & Sarah",
    ages: "26 & 24",
    bio: "Hiking enthusiasts and coffee addicts",
    image: "/placeholder.svg",
    gender: "F"
  },
  {
    id: 3,
    names: "Jack & Tom",
    ages: "28 & 29",
    bio: "Sports fanatics and BBQ masters",
    image: "/placeholder.svg",
    gender: "M"
  },
  {
    id: 4,
    names: "Mike & Chris",
    ages: "27 & 26",
    bio: "Music lovers and craft beer enthusiasts",
    image: "/placeholder.svg",
    gender: "M"
  }
];

export const getMatchingPairs = (userGender: Gender): Pair[] => {
  return mockPairs.filter(pair => pair.gender !== userGender);
};
