import { BarkRecord } from '@/types';

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
  const recordsWithAudio = records.filter(r => r.audioData).length;
  if (recordsWithAudio > 0) {
    lines.push(`含录音记录：${recordsWithAudio} 条`);
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
    if (record.location) line += ` | 位置：${record.location}`;
    if (record.dogDescription) line += ` | 特征：${record.dogDescription}`;
    if (record.note) line += ` | 备注：${record.note}`;
    if (record.tags && record.tags.length > 0) line += ` | 标签：${record.tags.join(', ')}`;
    if (record.audioData) line += ` | 🎵 录音${record.audioDuration ? `(${record.audioDuration}s)` : ''}`;
    lines.push(line);
  });
  
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
  formats: ('text' | 'json')[] = ['text', 'json']
): Promise<ExportBundle> {
  const bundle: ExportBundle = {
    audioFiles: [],
  };

  if (formats.includes('text')) {
    bundle.textReport = await createTextFileBlob(exportRecordsAsText(records), 'text/plain;charset=utf-8');
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
