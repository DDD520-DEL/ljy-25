export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  token: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface SyncStats {
  recordsPushed: number;
  dogsPushed: number;
  recordsPulled: number;
  dogsPulled: number;
  recordsMerged: number;
  dogsMerged: number;
  deletedLocal: number;
}

export interface SyncPhaseResult {
  pushSuccess: boolean;
  pushMessage: string;
  pushError?: string;
  pullSuccess: boolean;
  pullMessage: string;
  pullError?: string;
}

export interface SyncStatus {
  lastSyncAt: number;
  lastSyncDirection: 'push' | 'pull' | 'full' | 'login' | null;
  lastSyncSuccess: boolean;
  lastSyncMessage: string;
  pendingChanges: number;
  isSyncing: boolean;
  currentSyncType: 'push' | 'pull' | 'full' | null;
  lastError?: string;
  lastSyncStats: SyncStats;
  queueSize: number;
  justLoggedIn: boolean;
  loginSyncPhase: 'none' | 'pushing' | 'pulling' | 'done';
  lastLoginSyncResult: SyncPhaseResult | null;
}

export interface SyncRecord<T> {
  data: T;
  type: 'record' | 'dog';
  operation: 'create' | 'update' | 'delete';
  synced: boolean;
}

export interface SyncPushPayload {
  userId: string;
  records: BarkRecord[];
  dogs: DogProfile[];
  deletedRecordIds: string[];
  deletedDogIds: string[];
  lastSyncAt: number;
}

export interface SyncPullPayload {
  userId: string;
  since: number;
}

export interface SyncPullResponse {
  records: BarkRecord[];
  dogs: DogProfile[];
  deletedRecordIds: string[];
  deletedDogIds: string[];
  serverTime: number;
  hasMore: boolean;
}

export interface SyncFullResponse {
  records: BarkRecord[];
  dogs: DogProfile[];
  settings: AppSettings;
  serverTime: number;
}

export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface BarkRecord {
  id: string;
  timestamp: number;
  dogId?: string;
  location?: string;
  dogDescription?: string;
  duration?: number;
  note?: string;
  audioData?: string;
  audioMimeType?: string;
  audioDuration?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TagStats {
  tag: string;
  count: number;
  percentage: number;
}

export const PRESET_TAGS = ['快递', '装修', '遛狗路过', '夜间吠叫', '陌生人', '其他狗'] as const;

export interface HourlyStats {
  hour: number;
  count: number;
}

export interface WeeklyStats {
  day: number;
  hour: number;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
  timestamp: number;
}

export interface SummaryStats {
  totalRecords: number;
  dateRange: { start: number; end: number };
  dailyAverage: number;
  peakHour: number;
  peakDay: number;
  recordsByDay: DailyCount[];
}

export interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  times: ReminderTime[];
  lastTriggeredDates: Record<string, string>;
}

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  reminders: ReminderSettings;
}

export type DogMood = 'happy' | 'neutral' | 'confused' | 'sad' | 'tired';

export type TimePeriodPreset = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  start: number;
  end: number;
  label: string;
}

export interface TimePeriodOption {
  key: TimePeriodPreset;
  label: string;
}

export const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { key: 'thisWeek', label: '本周' },
  { key: 'lastWeek', label: '上周' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'custom', label: '自定义' },
];

export interface ComparisonStats {
  period1: {
    summary: SummaryStats;
    hourly: HourlyStats[];
    peakHourInfo: {
      hour: number;
      label: string;
      period: string;
      count: number;
    } | null;
    peakDayInfo: {
      day: number;
      label: string;
      fullLabel: string;
      count: number;
    } | null;
  };
  period2: {
    summary: SummaryStats;
    hourly: HourlyStats[];
    peakHourInfo: {
      hour: number;
      label: string;
      period: string;
      count: number;
    } | null;
    peakDayInfo: {
      day: number;
      label: string;
      fullLabel: string;
      count: number;
    } | null;
  };
  period1Label: string;
  period2Label: string;
  maxHourlyCount: number;
}

export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
export const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'] as const;

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function getDogMood(todayCount: number): DogMood {
  if (todayCount === 0) return 'happy';
  if (todayCount <= 3) return 'neutral';
  if (todayCount <= 6) return 'confused';
  if (todayCount <= 10) return 'sad';
  return 'tired';
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function getTimePeriod(hour: number): string {
  if (hour >= 0 && hour < 6) return '深夜';
  if (hour >= 6 && hour < 9) return '清晨';
  if (hour >= 9 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '中午';
  if (hour >= 14 && hour < 18) return '下午';
  if (hour >= 18 && hour < 22) return '晚间';
  return '深夜';
}
