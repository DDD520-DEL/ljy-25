import { BarkRecord, DogProfile, AppSettings, User, SyncStatus, AdminUser } from '@/types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportRecordsAsJSON(records: BarkRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function exportRecordsAsText(records: BarkRecord[], dogs?: DogProfile[]): string {
  if (records.length === 0) {
    return '暂无记录';
  }
  
  const getDogName = (dogId?: string) => {
    if (!dogId || !dogs) return '';
    const dog = dogs.find(d => d.id === dogId);
    return dog ? dog.name : '';
  };

  const lines: string[] = [];
  lines.push('狗叫记录报告');
  lines.push('='.repeat(40));
  lines.push(`总记录数：${records.length}`);
  const recordsWithAudio = records.filter(r => r.audioData).length;
  if (recordsWithAudio > 0) {
    lines.push(`含录音记录：${recordsWithAudio} 条`);
  }
  
  if (dogs && dogs.length > 0) {
    lines.push('');
    lines.push('狗狗统计：');
    lines.push('-'.repeat(40));
    dogs.forEach(dog => {
      const dogRecords = records.filter(r => r.dogId === dog.id);
      lines.push(`  ${dog.name}${dog.breed ? ` (${dog.breed})` : ''}: ${dogRecords.length} 次`);
    });
    const unassigned = records.filter(r => !r.dogId);
    if (unassigned.length > 0) {
      lines.push(`  未指定狗狗: ${unassigned.length} 次`);
    }
  }
  
  const tagCounts = new Map<string, number>();
  records.forEach(record => {
    record.tags?.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  if (tagCounts.size > 0) {
    lines.push('');
    lines.push('标签统计：');
    lines.push('-'.repeat(40));
    const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
    sortedTags.forEach(([tag, count]) => {
      lines.push(`  ${tag}: ${count} 次`);
    });
  }
  
  lines.push(`记录时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push('详细记录：');
  lines.push('-'.repeat(40));
  
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  sorted.forEach((record, index) => {
    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleString('zh-CN');
    let line = `${index + 1}. ${timeStr}`;
    const dogName = getDogName(record.dogId);
    if (dogName) line += ` | 狗狗：${dogName}`;
    if (record.location) line += ` | 位置：${record.location}`;
    if (record.dogDescription) line += ` | 特征：${record.dogDescription}`;
    if (record.note) line += ` | 备注：${record.note}`;
    if (record.tags && record.tags.length > 0) line += ` | 标签：${record.tags.join(', ')}`;
    if (record.audioData) line += ` | 🎵 录音${record.audioDuration ? `(${record.audioDuration}s)` : ''}`;
    lines.push(line);
  });
  
  if (dogs && dogs.length > 0) {
    lines.push('');
    lines.push('='.repeat(40));
    lines.push('按狗狗分组：');
    lines.push('-'.repeat(40));
    
    dogs.forEach(dog => {
      const dogRecords = sorted.filter(r => r.dogId === dog.id);
      lines.push('');
      lines.push(`【${dog.name}】(${dogRecords.length} 次)`);
      if (dog.breed) lines.push(`  品种：${dog.breed}`);
      if (dog.age) lines.push(`  年龄：${dog.age}`);
      if (dog.description) lines.push(`  描述：${dog.description}`);
      dogRecords.forEach((record) => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('zh-CN');
        let line = `  - ${timeStr}`;
        if (record.location) line += ` | ${record.location}`;
        if (record.note) line += ` | ${record.note}`;
        lines.push(line);
      });
    });
    
    const unassigned = sorted.filter(r => !r.dogId);
    if (unassigned.length > 0) {
      lines.push('');
      lines.push(`【未指定狗狗】(${unassigned.length} 次)`);
      unassigned.forEach((record) => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('zh-CN');
        let line = `  - ${timeStr}`;
        if (record.location) line += ` | ${record.location}`;
        if (record.note) line += ` | ${record.note}`;
        lines.push(line);
      });
    }
  } else {
    lines.push('');
    lines.push('='.repeat(40));
    lines.push('按标签分组：');
    lines.push('-'.repeat(40));
    
    const untaggedRecords = sorted.filter(r => !r.tags || r.tags.length === 0);
    const taggedRecords = sorted.filter(r => r.tags && r.tags.length > 0);
    
    const allTags = Array.from(tagCounts.keys()).sort();
    
    allTags.forEach(tag => {
      const tagRecords = taggedRecords.filter(r => r.tags?.includes(tag));
      lines.push('');
      lines.push(`【${tag}】(${tagRecords.length} 次)`);
      tagRecords.forEach((record) => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('zh-CN');
        let line = `  - ${timeStr}`;
        if (record.location) line += ` | ${record.location}`;
        if (record.note) line += ` | ${record.note}`;
        lines.push(line);
      });
    });
    
    if (untaggedRecords.length > 0) {
      lines.push('');
      lines.push(`【未打标】(${untaggedRecords.length} 次)`);
      untaggedRecords.forEach((record) => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('zh-CN');
        let line = `  - ${timeStr}`;
        if (record.location) line += ` | ${record.location}`;
        if (record.note) line += ` | ${record.note}`;
        lines.push(line);
      });
    }
  }
  
  return lines.join('\n');
}

export function getAudioExtension(mimeType?: string): string {
  if (!mimeType) return 'webm';
  if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export function formatSafeName(str: string): string {
  return str.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
}

export interface AudioFileInfo {
  fileName: string;
  dataUrl: string;
  recordIndex: number;
  timestamp: number;
}

export function extractAudioFiles(records: BarkRecord[]): AudioFileInfo[] {
  const audioFiles: AudioFileInfo[] = [];
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  
  sorted.forEach((record, index) => {
    if (record.audioData) {
      const date = new Date(record.timestamp);
      const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
      const ext = getAudioExtension(record.audioMimeType);
      const fileName = `录音_${(index + 1).toString().padStart(3, '0')}_${dateStr}_${timeStr}.${ext}`;
      
      audioFiles.push({
        fileName,
        dataUrl: record.audioData,
        recordIndex: index + 1,
        timestamp: record.timestamp,
      });
    }
  });
  
  return audioFiles;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

async function createTextFileBlob(content: string, mimeType: string): Promise<Blob> {
  return new Blob([content], { type: mimeType });
}

export interface ExportBundle {
  textReport?: Blob;
  jsonReport?: Blob;
  audioFiles: { fileName: string; blob: Blob }[];
  readme?: Blob;
}

export async function prepareExportBundle(
  records: BarkRecord[],
  formats: ('text' | 'json')[] = ['text', 'json'],
  dogs?: DogProfile[]
): Promise<ExportBundle> {
  const bundle: ExportBundle = {
    audioFiles: [],
  };

  if (formats.includes('text')) {
    bundle.textReport = await createTextFileBlob(exportRecordsAsText(records, dogs), 'text/plain;charset=utf-8');
  }
  if (formats.includes('json')) {
    bundle.jsonReport = await createTextFileBlob(exportRecordsAsJSON(records), 'application/json;charset=utf-8');
  }

  const audioInfos = extractAudioFiles(records);
  for (const info of audioInfos) {
    bundle.audioFiles.push({
      fileName: info.fileName,
      blob: dataUrlToBlob(info.dataUrl),
    });
  }

  if (audioInfos.length > 0) {
    const readmeContent = [
      '狗叫记录导出说明',
      '='.repeat(40),
      '',
      `导出时间：${new Date().toLocaleString('zh-CN')}`,
      `记录总数：${records.length} 条`,
      `录音文件：${audioInfos.length} 个`,
      '',
      '录音文件命名规则：',
      '  录音_序号_日期_时间.扩展名',
      '',
      '记录与录音对应关系：',
      '-'.repeat(40),
      ...audioInfos.map(info => {
        const record = records.find(r => r.timestamp === info.timestamp);
        const dateStr = new Date(info.timestamp).toLocaleString('zh-CN');
        let line = `${info.recordIndex}. [${info.fileName}] - ${dateStr}`;
        if (record?.location) line += ` | 位置：${record.location}`;
        if (record?.dogDescription) line += ` | 特征：${record.dogDescription}`;
        return line;
      }),
    ].join('\n');
    bundle.readme = await createTextFileBlob(readmeContent, 'text/plain;charset=utf-8');
  }

  return bundle;
}

export async function downloadBlob(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMultipleFiles(
  files: { fileName: string; blob: Blob }[],
  delayMs = 200
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    await downloadBlob(file.blob, file.fileName);
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export interface BackupBarkData {
  records: BarkRecord[];
  dogs: DogProfile[];
  settings: AppSettings;
  deletedRecordIds: string[];
  deletedDogIds: string[];
}

export interface BackupAuthData {
  user: User | null;
  isAuthenticated: boolean;
  syncStatus: SyncStatus;
}

export interface BackupAdminData {
  admin: AdminUser | null;
  isAuthenticated: boolean;
}

export interface BackupDataBundle {
  version: string;
  exportedAt: number;
  app: string;
  data: {
    bark: BackupBarkData;
    auth?: BackupAuthData;
    admin?: BackupAdminData;
  };
}

export const BACKUP_VERSION = '1.0';
export const BACKUP_APP_NAME = 'bark-recorder';

export function createBackupBundle(
  barkData: BackupBarkData,
  authData?: BackupAuthData,
  adminData?: BackupAdminData
): BackupDataBundle {
  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    app: BACKUP_APP_NAME,
    data: {
      bark: barkData,
      ...(authData && { auth: authData }),
      ...(adminData && { admin: adminData }),
    },
  };
}

export function serializeBackupBundle(bundle: BackupDataBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function parseBackupBundle(content: string): BackupDataBundle {
  try {
    const parsed = JSON.parse(content);
    if (!validateBackupBundle(parsed)) {
      throw new Error('备份文件格式无效');
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('备份文件不是有效的 JSON 格式');
    }
    throw err;
  }
}

export function validateBackupBundle(data: unknown): data is BackupDataBundle {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (d.app !== BACKUP_APP_NAME) return false;
  if (typeof d.version !== 'string') return false;
  if (typeof d.exportedAt !== 'number') return false;
  if (!d.data || typeof d.data !== 'object') return false;

  const dataObj = d.data as Record<string, unknown>;
  if (!dataObj.bark || typeof dataObj.bark !== 'object') return false;

  const bark = dataObj.bark as Record<string, unknown>;
  if (!Array.isArray(bark.records)) return false;
  if (!Array.isArray(bark.dogs)) return false;
  if (!bark.settings || typeof bark.settings !== 'object') return false;
  if (!Array.isArray(bark.deletedRecordIds)) return false;
  if (!Array.isArray(bark.deletedDogIds)) return false;

  return true;
}

export function getBackupFileName(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `狗叫记录备份_${dateStr}_${timeStr}.json`;
}

export async function exportBackupAsFile(bundle: BackupDataBundle): Promise<void> {
  const content = serializeBackupBundle(bundle);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const fileName = getBackupFileName();
  await downloadBlob(blob, fileName);
}

export interface RestoreSummary {
  recordsCount: number;
  dogsCount: number;
  hasSettings: boolean;
  hasAuth: boolean;
  hasAdmin: boolean;
  exportedAt: number;
}

export function getRestoreSummary(bundle: BackupDataBundle): RestoreSummary {
  return {
    recordsCount: bundle.data.bark.records.length,
    dogsCount: bundle.data.bark.dogs.length,
    hasSettings: !!bundle.data.bark.settings,
    hasAuth: !!bundle.data.auth,
    hasAdmin: !!bundle.data.admin,
    exportedAt: bundle.exportedAt,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('无法读取文件内容'));
      }
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsText(file, 'utf-8');
  });
}

export interface ExportProgress {
  stage: 'collecting' | 'serializing' | 'creating-file' | 'downloading';
  stageLabel: string;
  percent: number;
  message: string;
  estimatedSize?: string;
  recordCount?: number;
  dogCount?: number;
  withAudio?: number;
}

export interface ImportProgress {
  stage: 'reading' | 'parsing' | 'validating' | 'ready';
  stageLabel: string;
  percent: number;
  message: string;
  fileSize?: string;
  fileName?: string;
  readBytes?: number;
  totalBytes?: number;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;
export type ImportProgressCallback = (progress: ImportProgress) => void;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function estimateBackupSize(bundle: BackupDataBundle): number {
  const records = bundle.data.bark.records.length;
  const dogs = bundle.data.bark.dogs.length;
  const hasAudio = bundle.data.bark.records.filter(r => r.audioData).length;
  const avgRecordSize = 800;
  const avgDogSize = 300;
  const avgAudioSize = 50000;
  const settingsSize = 1000;
  const overhead = 500;
  return records * avgRecordSize + dogs * avgDogSize + hasAudio * avgAudioSize + settingsSize + overhead;
}

export async function serializeBackupBundleWithProgress(
  bundle: BackupDataBundle,
  onProgress?: ExportProgressCallback,
  yieldEveryMs = 30
): Promise<string> {
  const records = bundle.data.bark.records;
  const totalRecords = records.length;
  const hasAudio = records.filter(r => r.audioData).length;

  const parts: string[] = [];

  parts.push('{\n');
  parts.push(`  "version": ${JSON.stringify(bundle.version)},\n`);
  parts.push(`  "exportedAt": ${bundle.exportedAt},\n`);
  parts.push(`  "app": ${JSON.stringify(bundle.app)},\n`);
  parts.push(`  "data": {\n`);
  parts.push(`    "bark": {\n`);

  parts.push(`      "records": [\n`);

  let lastYield = Date.now();

  for (let i = 0; i < totalRecords; i++) {
    const record = records[i];
    const recordJson = JSON.stringify(record, null, 8);
    parts.push(recordJson);
    if (i < totalRecords - 1) {
      parts.push(',\n');
    }

    const now = Date.now();
    if (now - lastYield >= yieldEveryMs && onProgress) {
      const recordProgress = (i + 1) / Math.max(totalRecords, 1);
      const percent = Math.round(10 + recordProgress * 70);
      onProgress({
        stage: 'serializing',
        stageLabel: '正在序列化',
        percent,
        message: `正在处理记录 ${i + 1} / ${totalRecords}${hasAudio > 0 ? `（含录音 ${hasAudio} 条）` : ''}`,
        recordCount: totalRecords,
        dogCount: bundle.data.bark.dogs.length,
        withAudio: hasAudio,
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      lastYield = Date.now();
    }
  }

  parts.push('\n      ],\n');

  parts.push(`      "dogs": `);
  parts.push(JSON.stringify(bundle.data.bark.dogs, null, 6));
  parts.push(',\n');

  parts.push(`      "settings": `);
  parts.push(JSON.stringify(bundle.data.bark.settings, null, 6));
  parts.push(',\n');

  parts.push(`      "deletedRecordIds": `);
  parts.push(JSON.stringify(bundle.data.bark.deletedRecordIds, null, 6));
  parts.push(',\n');

  parts.push(`      "deletedDogIds": `);
  parts.push(JSON.stringify(bundle.data.bark.deletedDogIds, null, 6));
  parts.push('\n    }');

  if (bundle.data.auth) {
    parts.push(',\n    "auth": ');
    parts.push(JSON.stringify(bundle.data.auth, null, 4));
  }

  if (bundle.data.admin) {
    parts.push(',\n    "admin": ');
    parts.push(JSON.stringify(bundle.data.admin, null, 4));
  }

  parts.push('\n  }\n}');

  return parts.join('');
}

export async function exportBackupAsFileWithProgress(
  bundle: BackupDataBundle,
  onProgress?: ExportProgressCallback
): Promise<void> {
  onProgress?.({
    stage: 'creating-file',
    stageLabel: '正在生成文件',
    percent: 85,
    message: '正在生成 JSON 文件...',
    estimatedSize: formatBytes(estimateBackupSize(bundle)),
  });

  await new Promise(resolve => setTimeout(resolve, 50));

  const content = await serializeBackupBundleWithProgress(bundle, onProgress);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const fileName = getBackupFileName();

  onProgress?.({
    stage: 'downloading',
    stageLabel: '正在下载',
    percent: 95,
    message: `正在下载文件 (${formatBytes(blob.size)})...`,
    estimatedSize: formatBytes(blob.size),
  });

  await new Promise(resolve => setTimeout(resolve, 100));
  await downloadBlob(blob, fileName);

  onProgress?.({
    stage: 'downloading',
    stageLabel: '下载完成',
    percent: 100,
    message: `导出完成！文件大小：${formatBytes(blob.size)}`,
    estimatedSize: formatBytes(blob.size),
  });
}

export function readFileAsTextWithProgress(
  file: File,
  onProgress?: ImportProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 60);
        onProgress({
          stage: 'reading',
          stageLabel: '正在读取文件',
          percent,
          message: `已读取 ${formatBytes(e.loaded)} / ${formatBytes(e.total)}`,
          fileSize: formatBytes(file.size),
          fileName: file.name,
          readBytes: e.loaded,
          totalBytes: e.total,
        });
      }
    };

    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        onProgress?.({
          stage: 'parsing',
          stageLabel: '正在解析',
          percent: 70,
          message: '正在解析 JSON 数据...',
          fileSize: formatBytes(file.size),
          fileName: file.name,
        });

        await new Promise(resolve => setTimeout(resolve, 30));
        resolve(reader.result);
      } else {
        reject(new Error('无法读取文件内容'));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file, 'utf-8');
  });
}

export async function parseBackupBundleWithProgress(
  content: string,
  fileSize: number,
  fileName: string,
  onProgress?: ImportProgressCallback
): Promise<BackupDataBundle> {
  try {
    onProgress?.({
      stage: 'parsing',
      stageLabel: '正在解析',
      percent: 75,
      message: '正在解析 JSON 数据...',
      fileSize: formatBytes(fileSize),
      fileName,
    });

    await new Promise(resolve => setTimeout(resolve, 30));
    const parsed = JSON.parse(content);

    onProgress?.({
      stage: 'validating',
      stageLabel: '正在校验',
      percent: 90,
      message: '正在验证备份文件格式...',
      fileSize: formatBytes(fileSize),
      fileName,
    });

    await new Promise(resolve => setTimeout(resolve, 30));

    if (!validateBackupBundle(parsed)) {
      throw new Error('备份文件格式无效');
    }

    onProgress?.({
      stage: 'ready',
      stageLabel: '准备就绪',
      percent: 100,
      message: '备份文件解析完成',
      fileSize: formatBytes(fileSize),
      fileName,
    });

    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('备份文件不是有效的 JSON 格式');
    }
    throw err;
  }
}
