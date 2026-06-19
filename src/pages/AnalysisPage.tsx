import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Dog,
  GitCompare,
  BarChart2,
  ArrowRightLeft,
} from 'lucide-react';
import { HourlyChart } from '@/components/HourlyChart';
import { WeeklyHeatmap } from '@/components/WeeklyHeatmap';
import { StatsCard } from '@/components/StatsCard';
import { TagPieChart } from '@/components/TagPieChart';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { ComparisonBarChart } from '@/components/ComparisonBarChart';
import { ComparisonStatsCard } from '@/components/ComparisonStatsCard';
import { useStats } from '@/hooks/useStats';
import { useComparisonStats } from '@/hooks/useComparisonStats';
import { getTimePeriod, TimePeriodPreset } from '@/types';
import { formatFriendlyDate } from '@/utils/date';

export function AnalysisPage() {
  const [selectedDogId, setSelectedDogId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'normal' | 'comparison'>('normal');
  const [period1Preset, setPeriod1Preset] = useState<TimePeriodPreset>('thisWeek');
  const [period2Preset, setPeriod2Preset] = useState<TimePeriodPreset>('lastWeek');
  const [period1CustomStart, setPeriod1CustomStart] = useState<number | undefined>();
  const [period1CustomEnd, setPeriod1CustomEnd] = useState<number | undefined>();
  const [period2CustomStart, setPeriod2CustomStart] = useState<number | undefined>();
  const [period2CustomEnd, setPeriod2CustomEnd] = useState<number | undefined>();

  const {
    hasData,
    dogs,
    chartData,
    heatmapData,
    maxHourlyCount,
    maxWeeklyCount,
    summaryStats,
    peakHourInfo,
    peakDayInfo,
    tagRecordDistribution,
    dogStats,
  } = useStats(selectedDogId);

  const {
    comparisonStats,
    period1Label,
    period2Label,
    hasData: hasComparisonData,
  } = useComparisonStats(
    period1Preset,
    period2Preset,
    period1CustomStart,
    period1CustomEnd,
    period2CustomStart,
    period2CustomEnd,
    selectedDogId
  );

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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className="bg-white rounded-xl p-1 shadow-sm flex">
            <button
              onClick={() => setViewMode('normal')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'normal'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-amber-50'
              }`}
            >
              <BarChart2 size={16} />
              普通分析
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'comparison'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              <GitCompare size={16} />
              数据对比
            </button>
          </div>
        </motion.div>

        {viewMode === 'comparison' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePeriodSelector
                label="时段 1（对比基准）"
                selectedPreset={period1Preset}
                customStart={period1CustomStart}
                customEnd={period1CustomEnd}
                onPresetChange={setPeriod1Preset}
                onCustomRangeChange={(start, end) => {
                  setPeriod1CustomStart(start);
                  setPeriod1CustomEnd(end);
                }}
                color="amber"
              />
              <TimePeriodSelector
                label="时段 2（对比对象）"
                selectedPreset={period2Preset}
                customStart={period2CustomStart}
                customEnd={period2CustomEnd}
                onPresetChange={setPeriod2Preset}
                onCustomRangeChange={(start, end) => {
                  setPeriod2CustomStart(start);
                  setPeriod2CustomEnd(end);
                }}
                color="blue"
              />
            </div>
          </motion.div>
        )}

        {dogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: viewMode === 'comparison' ? 0.15 : 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedDogId(undefined)}
                className={`px-4 py-2 text-sm rounded-full border whitespace-nowrap transition-all ${
                  selectedDogId === undefined
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                }`}
              >
                全部
              </button>
              {dogs.map((dog) => (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id)}
                  className={`px-4 py-2 text-sm rounded-full border whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedDogId === dog.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <Dog size={14} />
                  {dog.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {dogs.length > 1 && selectedDogId === undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 bg-white rounded-2xl p-5 shadow-soft"
          >
            <h3 className="font-display text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Dog size={20} className="text-amber-600" />
              狗狗叫唤对比
            </h3>
            <div className="space-y-4">
              {dogStats.map((ds, index) => (
                <motion.div
                  key={ds.dog.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-20 text-sm font-medium text-gray-700 flex-shrink-0 flex items-center gap-1">
                    <Dog size={14} className="text-amber-500" />
                    {ds.dog.name}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-6 bg-amber-50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              summaryStats.totalRecords > 0
                                ? (ds.recordCount / summaryStats.totalRecords) * 100
                                : 0
                            }%`,
                          }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium text-amber-700">
                        {ds.recordCount} 次
                      </div>
                    </div>
                    {ds.recordCount > 0 ? (
                      ds.peakHour >= 0 && ds.peakHourLabel && (
                        <div className="text-xs text-gray-400">
                          最频繁：{ds.peakHourLabel}
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-gray-300">
                        暂无记录
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {(() => {
                const unassigned = summaryStats.totalRecords - dogStats.reduce((s, d) => s + d.recordCount, 0);
                if (unassigned > 0) {
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium text-gray-400 flex-shrink-0">
                        未指定
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  summaryStats.totalRecords > 0
                                    ? (unassigned / summaryStats.totalRecords) * 100
                                    : 0
                                }%`,
                              }}
                              transition={{ delay: 0.3 + dogStats.length * 0.1, duration: 0.5 }}
                            />
                          </div>
                          <div className="w-12 text-right text-sm font-medium text-gray-500">
                            {unassigned} 次
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </motion.div>
        )}

        {viewMode === 'normal' ? (
          <>
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
                    {selectedDogId && dogs.find((d) => d.id === selectedDogId) && (
                      <span className="text-white/80 text-base font-normal ml-2">
                        — {dogs.find((d) => d.id === selectedDogId)!.name}
                      </span>
                    )}
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
          </>
        ) : (
          <>
            {!hasComparisonData || !comparisonStats ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white/50 rounded-2xl mb-6"
              >
                <div className="text-6xl mb-4">📊</div>
                <p className="text-amber-700 font-medium">
                  所选时段没有数据哦
                </p>
                <p className="text-amber-500 text-sm mt-2">
                  试试选择其他时间段吧~
                </p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-blue-500 rounded-2xl p-5 mb-6 text-white shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <GitCompare className="flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-display text-lg font-bold mb-1">
                        对比分析
                        {selectedDogId && dogs.find((d) => d.id === selectedDogId) && (
                          <span className="text-white/80 text-base font-normal ml-2">
                            — {dogs.find((d) => d.id === selectedDogId)!.name}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{period1Label}</span>
                        <ArrowRightLeft size={14} />
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{period2Label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-4 mb-6">
                  <ComparisonStatsCard
                    icon={BarChart3}
                    label="总叫唤次数"
                    value1={comparisonStats.period1.summary.totalRecords}
                    value2={comparisonStats.period2.summary.totalRecords}
                    subValue1="次"
                    subValue2="次"
                    label1={period1Label}
                    label2={period2Label}
                    color1="amber"
                    color2="blue"
                  />

                  <ComparisonStatsCard
                    icon={TrendingUp}
                    label="日均叫唤次数"
                    value1={comparisonStats.period1.summary.dailyAverage.toFixed(1)}
                    value2={comparisonStats.period2.summary.dailyAverage.toFixed(1)}
                    subValue1="次/天"
                    subValue2="次/天"
                    label1={period1Label}
                    label2={period2Label}
                    color1="mint"
                    color2="blue"
                  />

                  <ComparisonStatsCard
                    icon={Clock}
                    label="高峰时段"
                    value1={comparisonStats.period1.peakHourInfo?.label || '暂无'}
                    value2={comparisonStats.period2.peakHourInfo?.label || '暂无'}
                    subValue1={comparisonStats.period1.peakHourInfo?.period || ''}
                    subValue2={comparisonStats.period2.peakHourInfo?.period || ''}
                    label1={period1Label}
                    label2={period2Label}
                    color1="coral"
                    color2="blue"
                    showTrend={false}
                  />

                  <ComparisonStatsCard
                    icon={Calendar}
                    label="高峰星期"
                    value1={comparisonStats.period1.peakDayInfo?.fullLabel || '暂无'}
                    value2={comparisonStats.period2.peakDayInfo?.fullLabel || '暂无'}
                    subValue1={comparisonStats.period1.peakDayInfo ? `${comparisonStats.period1.peakDayInfo.count} 次` : ''}
                    subValue2={comparisonStats.period2.peakDayInfo ? `${comparisonStats.period2.peakDayInfo.count} 次` : ''}
                    label1={period1Label}
                    label2={period2Label}
                    color1="amber"
                    color2="blue"
                    showTrend={false}
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-6"
                >
                  <ComparisonBarChart data={comparisonStats} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mb-6 bg-white rounded-2xl p-5 shadow-soft"
                >
                  <h3 className="font-display text-lg font-bold text-gray-800 mb-4">
                    对比详情
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">时段</div>
                        <div className="font-bold text-gray-800">指标</div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="text-xs text-amber-600 mb-1">{period1Label}</div>
                        <div className="font-bold text-amber-600">数值</div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="text-xs text-blue-600 mb-1">{period2Label}</div>
                        <div className="font-bold text-blue-600">数值</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">总记录</div>
                        <div className="font-bold text-gray-800 text-lg">
                          {comparisonStats.period1.summary.totalRecords + comparisonStats.period2.summary.totalRecords}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <div className="text-xs text-amber-600 mb-1">时段1</div>
                        <div className="font-bold text-amber-600 text-lg">
                          {comparisonStats.period1.summary.totalRecords}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="text-xs text-blue-600 mb-1">时段2</div>
                        <div className="font-bold text-blue-600 text-lg">
                          {comparisonStats.period2.summary.totalRecords}
                        </div>
                      </div>
                    </div>

                    {comparisonStats.period1.summary.recordsByDay.length > 0 && comparisonStats.period2.summary.recordsByDay.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="text-xs text-gray-500 mb-1">最高单天</div>
                          <div className="font-bold text-gray-800 text-lg">
                            {Math.max(
                              Math.max(...comparisonStats.period1.summary.recordsByDay.map(d => d.count)),
                              Math.max(...comparisonStats.period2.summary.recordsByDay.map(d => d.count))
                            )}
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3">
                          <div className="text-xs text-amber-600 mb-1">时段1</div>
                          <div className="font-bold text-amber-600 text-lg">
                            {Math.max(...comparisonStats.period1.summary.recordsByDay.map(d => d.count))}
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3">
                          <div className="text-xs text-blue-600 mb-1">时段2</div>
                          <div className="font-bold text-blue-600 text-lg">
                            {Math.max(...comparisonStats.period2.summary.recordsByDay.map(d => d.count))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </>
        )}

        {viewMode === 'normal' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-6"
            >
              <WeeklyHeatmap data={heatmapData} maxCount={maxWeeklyCount} />
            </motion.div>

            {tagRecordDistribution.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="mb-6"
              >
                <TagPieChart
                  data={tagRecordDistribution}
                  totalRecords={summaryStats.totalRecords}
                />
              </motion.div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
