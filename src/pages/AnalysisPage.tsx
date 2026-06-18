import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { HourlyChart } from '@/components/HourlyChart';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { StatsCard } from '@/components/StatsCard';
import { useStats } from '@/hooks/useStats';
import { getTimePeriod } from '@/types';
import { formatFriendlyDate } from '@/utils/date';

export function AnalysisPage() {
  const {
    hasData,
    chartData,
    heatmapData,
    maxHourlyCount,
    maxWeeklyCount,
    summaryStats,
    peakHourInfo,
    peakDayInfo,
  } = useStats();

  if (!hasData) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-amber-800 mb-2">
              📊 数据分析
            </h1>
            <p className="text-amber-600 text-sm">
              看看狗叫的规律
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white/50 rounded-2xl"
          >
            <div className="text-6xl mb-4">📈</div>
            <p className="text-amber-700 font-medium">
              还没有数据哦
            </p>
            <p className="text-amber-500 text-sm mt-2">
              先去记录一些狗叫数据吧~
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-amber-800 mb-2">
            📊 数据分析
          </h1>
          <p className="text-amber-600 text-sm">
            看看狗叫的规律
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="font-display text-lg font-bold mb-1">
                分析摘要
              </h3>
              <p className="text-white/90 text-sm">
                共记录 {summaryStats.totalRecords} 次，
                从 {formatFriendlyDate(summaryStats.dateRange.start)} 到{' '}
                {formatFriendlyDate(summaryStats.dateRange.end)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            icon={Clock}
            label="最闹时段"
            value={peakHourInfo?.label || '暂无'}
            subValue={peakHourInfo ? getTimePeriod(peakHourInfo.hour) : ''}
            color="coral"
            delay={0.3}
          />
          <StatsCard
            icon={Calendar}
            label="最闹星期"
            value={peakDayInfo?.fullLabel || '暂无'}
            subValue={peakHourInfo ? `${peakHourInfo.count} 次记录` : ''}
            color="amber"
            delay={0.4}
          />
          <StatsCard
            icon={TrendingUp}
            label="日均次数"
            value={summaryStats.dailyAverage.toFixed(1)}
            subValue="次/天"
            color="mint"
            delay={0.5}
          />
          <StatsCard
            icon={BarChart3}
            label="最高单天"
            value={
              summaryStats.recordsByDay.length > 0
                ? Math.max(...summaryStats.recordsByDay.map((d) => d.count))
                : 0
            }
            subValue="次"
            color="coral"
            delay={0.6}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <HourlyChart data={chartData} maxCount={maxHourlyCount} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <WeeklyHeatmap data={heatmapData} maxCount={maxWeeklyCount} />
        </motion.div>

        {summaryStats.recordsByDay.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-6 bg-white rounded-2xl p-5 shadow-soft"
          >
            <h3 className="font-display text-lg font-bold text-gray-800 mb-4">
              每日趋势
            </h3>
            <div className="space-y-2">
              {summaryStats.recordsByDay.slice(-7).map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-20 text-sm text-gray-600 flex-shrink-0">
                    {formatFriendlyDate(day.timestamp)}
                  </div>
                  <div className="flex-1 h-6 bg-amber-50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(day.count / Math.max(...summaryStats.recordsByDay.map((d) => d.count))) * 100}%`,
                      }}
                      transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm font-medium text-amber-700">
                    {day.count}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
