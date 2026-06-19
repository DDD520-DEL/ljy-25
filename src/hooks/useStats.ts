import { useMemo } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import {
  calculateHourlyStats,
  calculateWeeklyStats,
  calculateSummaryStats,
  calculateTagStats,
  calculateTagRecordDistribution,
  getAllTags,
  getMaxHourlyCount,
  getMaxWeeklyCount,
} from '@/utils/statistics';
import { WEEKDAY_SHORT, formatHour, getTimePeriod } from '@/types';

export function useStats() {
  const records = useBarkStore((state) => state.records);

  const hourlyStats = useMemo(() => calculateHourlyStats(records), [records]);
  
  const weeklyStats = useMemo(() => calculateWeeklyStats(records), [records]);
  
  const summaryStats = useMemo(() => calculateSummaryStats(records), [records]);
  
  const maxHourlyCount = useMemo(() => getMaxHourlyCount(hourlyStats), [hourlyStats]);
  
  const maxWeeklyCount = useMemo(() => getMaxWeeklyCount(weeklyStats), [weeklyStats]);

  const peakHourInfo = useMemo(() => {
    if (summaryStats.peakHour < 0) return null;
    return {
      hour: summaryStats.peakHour,
      label: formatHour(summaryStats.peakHour),
      period: getTimePeriod(summaryStats.peakHour),
      count: hourlyStats[summaryStats.peakHour]?.count || 0,
    };
  }, [summaryStats.peakHour, hourlyStats]);

  const peakDayInfo = useMemo(() => {
    if (summaryStats.peakDay < 0) return null;
    return {
      day: summaryStats.peakDay,
      label: WEEKDAY_SHORT[summaryStats.peakDay],
      fullLabel: `周${WEEKDAY_SHORT[summaryStats.peakDay]}`,
    };
  }, [summaryStats.peakDay]);

  const chartData = useMemo(() => {
    return hourlyStats.map((stat) => ({
      hour: stat.hour,
      hourLabel: `${stat.hour}时`,
      count: stat.count,
      isPeak: stat.hour === summaryStats.peakHour,
    }));
  }, [hourlyStats, summaryStats.peakHour]);

  const heatmapData = useMemo(() => {
    return weeklyStats.map((stat) => ({
      day: stat.day,
      hour: stat.hour,
      count: stat.count,
      dayLabel: WEEKDAY_SHORT[stat.day],
      hourLabel: formatHour(stat.hour),
      intensity: maxWeeklyCount > 0 ? stat.count / maxWeeklyCount : 0,
    }));
  }, [weeklyStats, maxWeeklyCount]);

  const tagStats = useMemo(() => calculateTagStats(records), [records]);
  
  const tagRecordDistribution = useMemo(
    () => calculateTagRecordDistribution(records),
    [records]
  );
  
  const allTags = useMemo(() => getAllTags(records), [records]);

  const hasData = useMemo(() => records.length > 0, [records]);

  return {
    records,
    hourlyStats,
    weeklyStats,
    summaryStats,
    maxHourlyCount,
    maxWeeklyCount,
    peakHourInfo,
    peakDayInfo,
    chartData,
    heatmapData,
    tagStats,
    tagRecordDistribution,
    allTags,
    hasData,
  };
}
