import { STORAGE_KEYS, BarkRecord, AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: false,
  theme: 'light',
};

export function loadRecords(): BarkRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load records:', error);
  }
  return [];
}

export function saveRecords(records: BarkRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save records:', error);
  }
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportRecordsAsJSON(records: BarkRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function exportRecordsAsText(records: BarkRecord[]): string {
  if (records.length === 0) {
    return '暂无记录';
  }
  
  const lines: string[] = [];
  lines.push('狗叫记录报告');
  lines.push('='.repeat(40));
  lines.push(`总记录数：${records.length}`);
  lines.push(`记录时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('详细记录：');
  lines.push('-'.repeat(40));
  
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  sorted.forEach((record, index) => {
    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleString('zh-CN');
    let line = `${index + 1}. ${timeStr}`;
    if (record.location) line += ` | 位置：${record.location}`;
    if (record.dogDescription) line += ` | 特征：${record.dogDescription}`;
    if (record.note) line += ` | 备注：${record.note}`;
    lines.push(line);
  });
  
  return lines.join('\n');
}
