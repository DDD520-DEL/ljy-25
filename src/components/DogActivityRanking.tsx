import { motion } from 'framer-motion';
import { Trophy, Dog, Medal } from 'lucide-react';
import { DogProfile } from '@/types';

interface DogRankingItem {
  dog: DogProfile;
  recordCount: number;
  rank: number;
}

interface DogActivityRankingProps {
  rankingData: DogRankingItem[];
  totalRecords: number;
}

const rankColors = [
  'from-yellow-400 to-amber-500',
  'from-gray-300 to-gray-400',
  'from-amber-600 to-amber-700',
];

const rankMedalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

export function DogActivityRanking({ rankingData, totalRecords }: DogActivityRankingProps) {
  if (rankingData.length === 0) {
    return null;
  }

  const maxCount = Math.max(...rankingData.map((d) => d.recordCount));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.15 }}
      className="bg-white rounded-2xl p-5 shadow-soft"
    >
      <h3 className="font-display text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Trophy size={20} className="text-amber-500" />
        狗狗活跃度排行榜
      </h3>

      <div className="space-y-3">
        {rankingData.map((item, index) => (
          <motion.div
            key={item.dog.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
              {index < 3 ? (
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankColors[index]} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                >
                  {item.rank}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-sm">
                  {item.rank}
                </div>
              )}
            </div>

            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
              {index < 3 ? (
                <Medal size={24} className={rankMedalColors[index]} />
              ) : (
                <Dog size={20} className="text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 truncate">
                  {item.dog.name}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {item.dog.breed || '未知品种'}
                </span>
              </div>
              <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                      : 'bg-gradient-to-r from-amber-300 to-amber-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${maxCount > 0 ? (item.recordCount / maxCount) * 100 : 0}%`,
                  }}
                  transition={{
                    delay: 1.3 + index * 0.1,
                    duration: 0.5,
                  }}
                />
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="font-bold text-amber-600 text-lg">
                {item.recordCount}
              </div>
              <div className="text-xs text-gray-400">
                {totalRecords > 0
                  ? ((item.recordCount / totalRecords) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
