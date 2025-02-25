
export type SwipeDirection = 'like' | 'pass';

export type Gender = 'M' | 'F';

export type Pair = {
  id: string;
  names: string;
  ages: string;
  bio: string;
  image: string;
};

export const SWIPE_THRESHOLD = 100;

export const getMatchingPairs = (userGender: Gender): Pair[] => {
  return [
    {
      id: '1',
      names: 'John & Mike',
      ages: '25, 27',
      bio: 'Looking for friends to hang out with',
      image: '/placeholder.svg'
    },
    {
      id: '2',
      names: 'Sarah & Emma',
      ages: '24, 26',
      bio: 'Love hiking and outdoor activities',
      image: '/placeholder.svg'
    }
  ];
};
