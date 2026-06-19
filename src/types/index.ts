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

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface BarkRecord {
  id: string;
  timestamp: number;
  dogId?: string;
  location?: string;
  geoLocation?: GeoLocation;
  locationShared?: boolean;
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

export interface HeatmapGridCell {
  gridLat: number;
  gridLng: number;
  count: number;
  intensity: number;
}

export interface NearbyHeatmapData {
  centerLat: number;
  centerLng: number;
  radius: number;
  gridSize: number;
  cells: HeatmapGridCell[];
  totalRecords: number;
  lastUpdated: number;
  dataDate: string;
}

export interface AnonymizedLocationRecord {
  gridLat: number;
  gridLng: number;
  hour: number;
  timestamp: number;
  recordId: string;
}

export interface LocationSharingSettings {
  enabled: boolean;
  precision: 'coarse' | 'medium' | 'fine';
  lastGrantedAt: number;
  lastDeniedAt: number;
}

export interface TagStats {
  tag: string;
  count: number;
  percentage: number;
}

export const PRESET_TAGS = ['快递', '装修', '遛狗路过', '夜间吠叫', '陌生人', '其他狗'] as const;

export const PRESET_BREEDS = [
  '中华田园犬',
  '金毛寻回犬',
  '拉布拉多',
  '哈士奇',
  '萨摩耶',
  '边境牧羊犬',
  '德国牧羊犬',
  '贵宾犬',
  '比熊犬',
  '博美犬',
  '雪纳瑞',
  '柯基',
  '柴犬',
  '秋田犬',
  '法国斗牛犬',
  '英国斗牛犬',
  '巴哥犬',
  '吉娃娃',
  '约克夏',
  '马尔济斯',
  '西施犬',
  '腊肠犬',
  '比格犬',
  '可卡犬',
  '阿拉斯加雪橇犬',
  '藏獒',
  '松狮犬',
  '沙皮犬',
  '巴吉度',
  '杜宾犬',
  '罗威纳',
  '大白熊',
  '古牧',
  '苏格兰牧羊犬',
  '喜乐蒂',
  '蝴蝶犬',
  '京巴',
  '银狐犬',
  '查理士王小猎犬',
  '惠比特犬',
  '灵缇',
  '牛头梗',
  '比特犬',
  '伯恩山犬',
  '圣伯纳',
  '纽芬兰犬',
  '阿富汗猎犬',
  '万能梗',
  '贝灵顿梗',
  '凯利蓝梗',
] as const;

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
  lastDailyPopupDate: string;
}

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  reminders: ReminderSettings;
  locationSharing: LocationSharingSettings;
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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  token: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalRecords: number;
  activeUsersToday: number;
  activeUsersYesterday: number;
  newUsersToday: number;
  newUsersYesterday: number;
  recordsToday: number;
  recordsYesterday: number;
  averageRecordsPerUser: number;
}

export interface DailyActiveData {
  date: string;
  timestamp: number;
  activeUsers: number;
  newUsers: number;
  totalRecords: number;
}

export interface RegionData {
  province: string;
  city: string;
  userCount: number;
  recordCount: number;
  lat: number;
  lng: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  dailyTrend: DailyActiveData[];
  regionDistribution: RegionData[];
  lastUpdated: number;
  dataFrom: number;
  dataTo: number;
}

export interface AdminDateRange {
  start: number;
  end: number;
  label: string;
}

export const ADMIN_DATE_RANGE_OPTIONS: { key: string; label: string; getRange: () => AdminDateRange }[] = [
  {
    key: 'today',
    label: '今日',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { start, end: Date.now(), label: '今日' };
    },
  },
  {
    key: 'yesterday',
    label: '昨日',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1;
      return { start, end, label: '昨日' };
    },
  },
  {
    key: 'last7days',
    label: '近7天',
    getRange: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1 + 86400000;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
      return { start, end, label: '近7天' };
    },
  },
  {
    key: 'last30days',
    label: '近30天',
    getRange: () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1 + 86400000;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
      return { start, end, label: '近30天' };
    },
  },
  {
    key: 'custom',
    label: '自定义',
    getRange: () => {
      const now = new Date();
      const end = Date.now();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
      return { start, end, label: '自定义' };
    },
  },
];
