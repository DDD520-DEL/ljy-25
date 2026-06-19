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
  filterRecordsByDateRange,
} from '@/utils/statistics';
import { WEEKDAY_SHORT, formatHour, getTimePeriod } from '@/types';
import { getDateRangeForPreset } from '@/utils/date';

export function useStats(dogId?: string) {
  const records = useBarkStore((state) => state.records);
  const dogs = useBarkStore((state) => state.dogs);

  const filteredRecords = useMemo(() => {
    if (dogId === undefined) return records;
    if (dogId === '__all__') return records;
    return records.filter((r) => r.dogId === dogId);
  }, [records, dogId]);

  const hourlyStats = useMemo(() => calculateHourlyStats(filteredRecords), [filteredRecords]);
  
  const weeklyStats = useMemo(() => calculateWeeklyStats(filteredRecords), [filteredRecords]);
  
  const summaryStats = useMemo(() => calculateSummaryStats(filteredRecords), [filteredRecords]);
  
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

  const tagStats = useMemo(() => calculateTagStats(filteredRecords), [filteredRecords]);
  
  const tagRecordDistribution = useMemo(
    () => calculateTagRecordDistribution(filteredRecords),
    [filteredRecords]
  );
  
  const allTags = useMemo(() => getAllTags(filteredRecords), [filteredRecords]);

  const hasData = useMemo(() => filteredRecords.length > 0, [filteredRecords]);

  const dogStats = useMemo(() => {
    return dogs.map((dog) => {
      const dogRecords = records.filter((r) => r.dogId === dog.id);
      const stats = calculateSummaryStats(dogRecords);
      const hourly = calculateHourlyStats(dogRecords);
      const maxH = getMaxHourlyCount(hourly);
      let peakHour = -1;
      let peakHourLabel = '';
      if (dogRecords.length > 0) {
        peakHour = hourly.reduce(
          (max, curr) => (curr.count > max.count ? curr : max),
          hourly[0]
        ).hour;
        peakHourLabel = peakHour >= 0 ? formatHour(peakHour) : '';
      }
      return {
        dog,
        recordCount: dogRecords.length,
        summaryStats: stats,
        hourlyStats: hourly,
        maxHourlyCount: maxH,
        peakHour,
        peakHourLabel,
      };
    });
  }, [dogs, records]);

  const dogRanking = useMemo(() => {
    return dogStats
      .filter((ds) => ds.recordCount > 0)
      .sort((a, b) => b.recordCount - a.recordCount)
      .map((ds, index) => ({
        dog: ds.dog,
        recordCount: ds.recordCount,
        rank: index + 1,
      }));
  }, [dogStats]);

  const weekComparison = useMemo(() => {
    const thisWeekRange = getDateRangeForPreset('thisWeek');
    const lastWeekRange = getDateRangeForPreset('lastWeek');

    const thisWeekRecords = filterRecordsByDateRange(filteredRecords, thisWeekRange);
    const lastWeekRecords = filterRecordsByDateRange(filteredRecords, lastWeekRange);

    const thisWeekCount = thisWeekRecords.length;
    const lastWeekCount = lastWeekRecords.length;

    const diff = thisWeekCount - lastWeekCount;
    const percentChange = lastWeekCount > 0
      ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
      : thisWeekCount > 0 ? 100 : 0;

    return {
      thisWeekCount,
      lastWeekCount,
      diff,
      percentChange,
      thisWeekLabel: thisWeekRange.label,
      lastWeekLabel: lastWeekRange.label,
    };
  }, [filteredRecords]);

  return {
    records,
    filteredRecords,
    dogs,
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
    dogStats,
    dogRanking,
    weekComparison,
  };
}
