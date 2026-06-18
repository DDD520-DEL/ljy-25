import {
  BarkRecord,
  HourlyStats,
  WeeklyStats,
  SummaryStats,
  DailyCount,
  HOURS,
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
