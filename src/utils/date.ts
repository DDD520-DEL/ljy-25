import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
