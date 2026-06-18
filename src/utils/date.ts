import {
  format,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  differenceInDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatTime(timestamp: number): string {
  return format(timestamp, 'HH:mm', { locale: zhCN });
}

export function formatFullTime(timestamp: number): string {
  return format(timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
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

export function isSameDay(ts1: number, ts2: number): boolean {
  return formatDate(ts1) === formatDate(ts2);
}

export function getTodayRange(): { start: number; end: number } {
  const now = new Date();
  return {
    start: startOfDay(now).getTime(),
    end: endOfDay(now).getTime(),
  };
}

export function getWeekRange(): { start: number; end: number } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
    end: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
  };
}

export function getDaysBetween(start: number, end: number): number {
  return differenceInDays(end, start) + 1;
}

export function getRelativeDayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return '今天';
  if (isYesterday(date)) return '昨天';
  return format(date, 'EEE', { locale: zhCN });
}
