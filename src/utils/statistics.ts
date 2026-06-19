import {
  BarkRecord,
  HourlyStats,
  WeeklyStats,
  SummaryStats,
  DailyCount,
  TagStats,
  HOURS,
  WEEKDAY_SHORT,
  formatHour,
  getTimePeriod,
} from '@/types';
import { formatDate, getHour, getDayOfWeek, getDaysBetween } from './date';

export function calculateHourlyStats(records: BarkRecord[]): HourlyStats[] {
  const counts = new Map<number, number>();
  
  HOURS.forEach(hour => counts.set(hour, 0));
  
  records.forEach(record => {
    const hour = getHour(record.timestamp);
    counts.set(hour, (counts.get(hour) || 0) + 1);
  });
  
  return HOURS.map(hour => ({
    hour,
    count: counts.get(hour) || 0,
  }));
}

export function calculateWeeklyStats(records: BarkRecord[]): WeeklyStats[] {
  const stats: WeeklyStats[] = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      stats.push({ day, hour, count: 0 });
    }
  }
  
  records.forEach(record => {
    const day = getDayOfWeek(record.timestamp);
    const hour = getHour(record.timestamp);
    const index = day * 24 + hour;
    stats[index].count++;
  });
  
  return stats;
}

export function calculateDailyCounts(records: BarkRecord[]): DailyCount[] {
  const dayMap = new Map<string, { count: number; timestamp: number }>();
  
  records.forEach(record => {
    const date = formatDate(record.timestamp);
    const existing = dayMap.get(date);
    if (existing) {
      existing.count++;
    } else {
      dayMap.set(date, { count: 1, timestamp: record.timestamp });
    }
  });
  
  return Array.from(dayMap.entries())
    .map(([date, { count, timestamp }]) => ({ date, count, timestamp }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function calculateSummaryStats(records: BarkRecord[]): SummaryStats {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      dateRange: { start: 0, end: 0 },
      dailyAverage: 0,
      peakHour: -1,
      peakDay: -1,
      recordsByDay: [],
    };
  }
  
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp;
  const days = Math.max(1, getDaysBetween(start, end));
  
  const hourlyStats = calculateHourlyStats(records);
  const peakHour = hourlyStats.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    hourlyStats[0]
  ).hour;
  
  const dayCounts = new Array(7).fill(0);
  records.forEach(record => {
    dayCounts[getDayOfWeek(record.timestamp)]++;
  });
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  
  const recordsByDay = calculateDailyCounts(records);
  
  return {
    totalRecords: records.length,
    dateRange: { start, end },
    dailyAverage: records.length / days,
    peakHour,
    peakDay,
    recordsByDay,
  };
}

export function getTodayRecords(records: BarkRecord[]): BarkRecord[] {
  const today = formatDate(Date.now());
  return records.filter(r => formatDate(r.timestamp) === today);
}

export function getMaxHourlyCount(hourlyStats: HourlyStats[]): number {
  if (hourlyStats.length === 0) return 0;
  return Math.max(...hourlyStats.map(s => s.count));
}

export function getMaxWeeklyCount(weeklyStats: WeeklyStats[]): number {
  if (weeklyStats.length === 0) return 0;
  return Math.max(...weeklyStats.map(s => s.count));
}

export function groupRecordsByDate(records: BarkRecord[]): Map<string, BarkRecord[]> {
  const groups = new Map<string, BarkRecord[]>();
  
  records.forEach(record => {
    const date = formatDate(record.timestamp);
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(record);
  });
  
  const sortedDates = Array.from(groups.keys()).sort().reverse();
  const sortedGroups = new Map<string, BarkRecord[]>();
  sortedDates.forEach(date => {
    sortedGroups.set(date, groups.get(date)!.sort((a, b) => b.timestamp - a.timestamp));
  });
  
  return sortedGroups;
}

export function calculateTagStats(records: BarkRecord[]): TagStats[] {
  const tagCounts = new Map<string, number>();
  let totalTagged = 0;

  records.forEach(record => {
    if (record.tags && record.tags.length > 0) {
      record.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        totalTagged++;
      });
    }
  });

  const stats: TagStats[] = Array.from(tagCounts.entries()).map(([tag, count]) => ({
    tag,
    count,
    percentage: totalTagged > 0 ? (count / totalTagged) * 100 : 0,
  }));

  return stats.sort((a, b) => b.count - a.count);
}

export interface TagRecordDistribution {
  tag: string;
  count: number;
  percentage: number;
}

export const MULTI_TAG_KEY = '__multi_tag__';
export const UNTAGGED_KEY = '__untagged__';

export function calculateTagRecordDistribution(
  records: BarkRecord[]
): TagRecordDistribution[] {
  const singleTagCounts = new Map<string, number>();
  let multiTagCount = 0;
  let untaggedCount = 0;

  records.forEach(record => {
    const tags = record.tags || [];
    if (tags.length === 0) {
      untaggedCount++;
    } else if (tags.length === 1) {
      singleTagCounts.set(tags[0], (singleTagCounts.get(tags[0]) || 0) + 1);
    } else {
      multiTagCount++;
    }
  });

  const total = records.length;
  const result: TagRecordDistribution[] = [];

  Array.from(singleTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => {
      result.push({
        tag,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      });
    });

  if (multiTagCount > 0) {
    result.push({
      tag: MULTI_TAG_KEY,
      count: multiTagCount,
      percentage: total > 0 ? (multiTagCount / total) * 100 : 0,
    });
  }

  if (untaggedCount > 0) {
    result.push({
      tag: UNTAGGED_KEY,
      count: untaggedCount,
      percentage: total > 0 ? (untaggedCount / total) * 100 : 0,
    });
  }

  return result;
}

export function filterRecordsByTags(
  records: BarkRecord[],
  selectedTags: string[],
  matchAll: boolean = false
): BarkRecord[] {
  if (selectedTags.length === 0) return records;

  return records.filter(record => {
    const recordTags = record.tags || [];
    if (matchAll) {
      return selectedTags.every(tag => recordTags.includes(tag));
    } else {
      return selectedTags.some(tag => recordTags.includes(tag));
    }
  });
}

export function getAllTags(records: BarkRecord[]): string[] {
  const tagSet = new Set<string>();
  records.forEach(record => {
    record.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export function filterRecordsByDateRange(
  records: BarkRecord[],
  dateRange: { start: number; end: number }
): BarkRecord[] {
  return records.filter(
    (r) => r.timestamp >= dateRange.start && r.timestamp <= dateRange.end
  );
}

export function calculateComparisonStats(
  period1Records: BarkRecord[],
  period2Records: BarkRecord[],
  period1Label: string,
  period2Label: string
) {
  const period1Summary = calculateSummaryStats(period1Records);
  const period2Summary = calculateSummaryStats(period2Records);
  const period1Hourly = calculateHourlyStats(period1Records);
  const period2Hourly = calculateHourlyStats(period2Records);

  const maxHourlyCount = Math.max(
    getMaxHourlyCount(period1Hourly),
    getMaxHourlyCount(period2Hourly)
  );

  const getPeakHourInfo = (summary: SummaryStats, hourly: HourlyStats[]) => {
    if (summary.peakHour < 0) return null;
    return {
      hour: summary.peakHour,
      label: formatHour(summary.peakHour),
      period: getTimePeriod(summary.peakHour),
      count: hourly[summary.peakHour]?.count || 0,
    };
  };

  const getPeakDayInfo = (summary: SummaryStats) => {
    if (summary.peakDay < 0) return null;
    return {
      day: summary.peakDay,
      label: WEEKDAY_SHORT[summary.peakDay],
      fullLabel: `周${WEEKDAY_SHORT[summary.peakDay]}`,
    };
  };

  return {
    period1: {
      summary: period1Summary,
      hourly: period1Hourly,
      peakHourInfo: getPeakHourInfo(period1Summary, period1Hourly),
      peakDayInfo: getPeakDayInfo(period1Summary),
    },
    period2: {
      summary: period2Summary,
      hourly: period2Hourly,
      peakHourInfo: getPeakHourInfo(period2Summary, period2Hourly),
      peakDayInfo: getPeakDayInfo(period2Summary),
    },
    period1Label,
    period2Label,
    maxHourlyCount,
  };
}
