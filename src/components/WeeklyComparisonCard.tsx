import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyComparisonCardProps {
  thisWeekCount: number;
  lastWeekCount: number;
  percentChange: number;
  thisWeekLabel: string;
  lastWeekLabel: string;
  delay?: number;
}

export function WeeklyComparisonCard({
  thisWeekCount,
  lastWeekCount,
  percentChange,
  thisWeekLabel,
  lastWeekLabel,
  delay = 0,
}: WeeklyComparisonCardProps) {
  const isUp = percentChange > 0;
  const isDown = percentChange < 0;

  const trendColor = isUp
    ? 'text-amber-600'
    : isDown
    ? 'text-emerald-600'
    : 'text-gray-400';

  const trendBgColor = isUp
    ? 'bg-amber-50'
    : isDown
    ? 'bg-emerald-50'
    : 'bg-gray-50';

  const trendIconColor = isUp
    ? 'text-amber-500'
    : isDown
    ? 'text-emerald-500'
    : 'text-gray-400';

  return (
    <motion.div
      className="bg-white rounded-2xl p-4 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-indigo-50">
          <Calendar size={18} className="text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-gray-600">周对比统计</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-indigo-50">
          <div className="text-xs text-gray-500 mb-1">本周</div>
          <div className="text-2xl font-bold text-indigo-600">{thisWeekCount}</div>
          <div className="text-xs text-gray-400 mt-1 truncate" title={thisWeekLabel}>
            {thisWeekLabel.replace(/^.*\(/, '(').replace('本周 ', '')}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50">
          <div className="text-xs text-gray-500 mb-1">上周</div>
          <div className="text-2xl font-bold text-blue-600">{lastWeekCount}</div>
          <div className="text-xs text-gray-400 mt-1 truncate" title={lastWeekLabel}>
            {lastWeekLabel.replace(/^.*\(/, '(').replace('上周 ', '')}
          </div>
        </div>
      </div>

      <div className={cn('flex items-center justify-between p-3 rounded-xl', trendBgColor)}>
        <span className="text-xs text-gray-500">变化趋势</span>
        <div className="flex items-center gap-2">
          {isUp ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
              className="flex items-center gap-1"
            >
              <TrendingUp size={18} className={trendIconColor} />
              <span className={cn('text-sm font-bold', trendColor)}>
                +{thisWeekCount - lastWeekCount} 次
              </span>
              <span className={cn('text-lg font-black', trendColor)}>
                +{percentChange.toFixed(1)}%
              </span>
            </motion.div>
          ) : isDown ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
              className="flex items-center gap-1"
            >
              <TrendingDown size={18} className={trendIconColor} />
              <span className={cn('text-sm font-bold', trendColor)}>
                {thisWeekCount - lastWeekCount} 次
              </span>
              <span className={cn('text-lg font-black', trendColor)}>
                {percentChange.toFixed(1)}%
              </span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1">
              <Minus size={18} className={trendIconColor} />
              <span className={cn('text-sm font-bold', trendColor)}>持平</span>
              <span className={cn('text-lg font-black', trendColor)}>0%</span>
            </div>
          )}
        </div>
      </div>

      {(lastWeekCount === 0 && thisWeekCount > 0) && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          上周无记录，本周开始有数据啦
        </div>
      )}
      {(lastWeekCount === 0 && thisWeekCount === 0) && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          最近两周暂无记录，快去记录吧
        </div>
      )}
    </motion.div>
  );
}
