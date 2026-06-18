import { motion } from 'framer-motion';
import { DogMood as DogMoodType } from '@/types';

interface DogMoodProps {
  mood: DogMoodType;
  size?: 'sm' | 'md' | 'lg';
}

const moodEmojis: Record<DogMoodType, string> = {
  happy: '🐕',
  neutral: '🐶',
  confused: '😐',
  sad: '😢',
  tired: '😴',
};

const moodMessages: Record<DogMoodType, string> = {
  happy: '今天很安静~',
  neutral: '还好啦~',
  confused: '有点吵哦',
  sad: '快受不了了',
  tired: '困困困...',
};

const sizeClasses = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
};

export function DogMood({ mood, size = 'md' }: DogMoodProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={sizeClasses[size]}
        animate={mood === 'happy' ? { y: [0, -5, 0] } : {}}
        transition={mood === 'happy' ? { repeat: Infinity, duration: 2 } : {}}
      >
        {moodEmojis[mood]}
      </motion.div>
      <span className="text-amber-700 font-medium text-sm">
        {moodMessages[mood]}
      </span>
    </motion.div>
  );
}
