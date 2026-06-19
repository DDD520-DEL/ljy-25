import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DateRange, TimePeriodPreset } from '@/types';

export function formatTime(timestamp: number): string {
  return format(timestamp, 'HH:mm', { locale: zhCN });
}

export function formatDate(timestamp: number): string {
  return format(timestamp, 'yyyy-MM-dd', { locale: zhCN });
}

export function formatFriendlyDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return '今天';
  }
  if (isYesterday(date)) {
    return '昨天';
  }
  return format(timestamp, 'M月d日', { locale: zhCN });
}

export function formatFriendlyDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = formatTime(timestamp);
  if (isToday(date)) {
    return `今天 ${time}`;
  }
  if (isYesterday(date)) {
    return `昨天 ${time}`;
  }
  return `${formatFriendlyDate(timestamp)} ${time}`;
}

export function getHour(timestamp: number): number {
  return new Date(timestamp).getHours();
}

export function getDayOfWeek(timestamp: number): number {
  return new Date(timestamp).getDay();
}

export function getDaysBetween(start: number, end: number): number {
  return differenceInDays(end, start) + 1;
}

export function getDateRangeForPreset(preset: TimePeriodPreset, customStart?: number, customEnd?: number): DateRange {
  const now = Date.now();
  
  switch (preset) {
    case 'thisWeek': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        start: start.getTime(),
        end: end.getTime(),
        label: `本周 (${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })})`,
      };
    }
    case 'lastWeek': {
      const lastWeek = subWeeks(now, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
      return {
        start: start.getTime(),
        end: end.getTime(),
        label: `上周 (${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })})`,
      };
    }
    case 'thisMonth': {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        start: start.getTime(),
        end: end.getTime(),
        label: `本月 (${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })})`,
      };
    }
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      return {
        start: start.getTime(),
        end: end.getTime(),
        label: `上月 (${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })})`,
      };
    }
    case 'custom':
    default:
      if (customStart && customEnd) {
        return {
          start: customStart,
          end: customEnd,
          label: `自定义 (${format(customStart, 'M月d日', { locale: zhCN })} - ${format(customEnd, 'M月d日', { locale: zhCN })})`,
        };
      }
      return {
        start: now,
        end: now,
        label: '自定义',
      };
  }
}

export function isInDateRange(timestamp: number, range: { start: number; end: number }): boolean {
  return isWithinInterval(timestamp, {
    start: new Date(range.start),
    end: new Date(range.end),
  });
}

export function formatDateRange(start: number, end: number): string {
  return `${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })}`;
}
