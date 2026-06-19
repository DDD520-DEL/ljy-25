import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Download,
  Check,
  FileText,
  Code2,
  AlertCircle,
  Music,
  FileAudio,
  Loader2,
  Info,
} from 'lucide-react';
import { useBarkRecords } from '@/hooks/useBarkRecords';
import { useStats } from '@/hooks/useStats';
import { useBarkStore } from '@/store/useBarkStore';
import {
  exportRecordsAsText,
  exportRecordsAsJSON,
  prepareExportBundle,
  downloadBlob,
  downloadMultipleFiles,
  extractAudioFiles,
} from '@/utils/storage';
import { WEEKDAYS } from '@/types';

export function ExportPage() {
  const { records } = useBarkRecords();
  const { summaryStats, peakHourInfo, peakDayInfo, chartData, maxHourlyCount } =
    useStats();
  const dogs = useBarkStore((s) => s.dogs);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'text' | 'json'>('text');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  const audioFiles = useMemo(() => extractAudioFiles(records), [records]);
  const hasAudio = audioFiles.length > 0;

  const textReport = useMemo(() => {
    return exportRecordsAsText(records, dogs);
  }, [records, dogs]);

  const jsonReport = useMemo(() => {
    return exportRecordsAsJSON(records);
  }, [records]);

  const currentContent = exportFormat === 'text' ? textReport : jsonReport;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDatePrefix = () => {
    return new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
  };

  const handleDownloadReport = async () => {
    const isText = exportFormat === 'text';
    const blob = new Blob([currentContent], {
      type: isText ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const fileName = `狗叫记录_${getDatePrefix()}.${isText ? 'txt' : 'json'}`;
    await downloadBlob(blob, fileName);
  };

  const handleDownloadAll = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadMessage('正在准备导出文件...');

    try {
      const formats: ('text' | 'json')[] = [exportFormat];
      const bundle = await prepareExportBundle(records, formats, dogs);

      const allFiles: { fileName: string; blob: Blob }[] = [];
      const datePrefix = getDatePrefix();

      if (bundle.textReport) {
        allFiles.push({
          fileName: `狗叫记录_${datePrefix}.txt`,
          blob: bundle.textReport,
        });
      }
      if (bundle.jsonReport && exportFormat === 'json') {
        allFiles.push({
          fileName: `狗叫记录_${datePrefix}.json`,
          blob: bundle.jsonReport,
        });
      }
      if (includeAudio && hasAudio) {
        allFiles.push(...bundle.audioFiles);
        if (bundle.readme) {
          allFiles.push({
            fileName: `导出说明_${datePrefix}.txt`,
            blob: bundle.readme,
          });
        }
      }

      const totalFiles = allFiles.length;
      setDownloadMessage(`共 ${totalFiles} 个文件，开始下载...`);

      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setDownloadProgress(Math.round(((i + 1) / totalFiles) * 100));
        setDownloadMessage(`正在下载 (${i + 1}/${totalFiles})：${file.fileName}`);
        await downloadBlob(file.blob, file.fileName);
        if (i < allFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      setDownloadMessage(`✓ 下载完成！共 ${totalFiles} 个文件`);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setDownloadMessage('导出失败，请重试');
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    }
  };

  const handleDownloadAudioOnly = async () => {
    if (isDownloading || !hasAudio) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const bundle = await prepareExportBundle(records, [], dogs);
      const allFiles: { fileName: string; blob: Blob }[] = [...bundle.audioFiles];
      if (bundle.readme) {
        allFiles.push({
          fileName: `导出说明_${getDatePrefix()}.txt`,
          blob: bundle.readme,
        });
      }

      const totalFiles = allFiles.length;
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setDownloadProgress(Math.round(((i + 1) / totalFiles) * 100));
        setDownloadMessage(`下载录音 (${i + 1}/${totalFiles})：${file.fileName}`);
        await downloadBlob(file.blob, file.fileName);
        if (i < allFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      setDownloadMessage(`✓ 录音下载完成！共 ${bundle.audioFiles.length} 个文件`);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    } catch (error) {
      setDownloadMessage('下载失败，请重试');
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    }
  };

  const handleDownloadByDog = async () => {
    if (isDownloading || dogs.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadMessage('正在按狗狗拆分数据...');

    try {
      const datePrefix = getDatePrefix();
      const allFiles: { fileName: string; blob: Blob }[] = [];

      dogs.forEach((dog) => {
        const dogRecords = records.filter((r) => r.dogId === dog.id);
        if (dogRecords.length === 0) return;
        const safeName = dog.name.replace(/[\\/:*?"<>|]/g, '_').substring(0, 20);
        if (exportFormat === 'text') {
          const content = exportRecordsAsText(dogRecords, dogs);
          allFiles.push({
            fileName: `狗叫记录_${safeName}_${datePrefix}.txt`,
            blob: new Blob([content], { type: 'text/plain;charset=utf-8' }),
          });
        } else {
          const content = exportRecordsAsJSON(dogRecords);
          allFiles.push({
            fileName: `狗叫记录_${safeName}_${datePrefix}.json`,
            blob: new Blob([content], { type: 'application/json;charset=utf-8' }),
          });
        }
      });

      const unassigned = records.filter((r) => !r.dogId);
      if (unassigned.length > 0) {
        if (exportFormat === 'text') {
          const content = exportRecordsAsText(unassigned, dogs);
          allFiles.push({
            fileName: `狗叫记录_未指定_${datePrefix}.txt`,
            blob: new Blob([content], { type: 'text/plain;charset=utf-8' }),
          });
        } else {
          const content = exportRecordsAsJSON(unassigned);
          allFiles.push({
            fileName: `狗叫记录_未指定_${datePrefix}.json`,
            blob: new Blob([content], { type: 'application/json;charset=utf-8' }),
          });
        }
      }

      const totalFiles = allFiles.length;
      setDownloadMessage(`共 ${totalFiles} 个文件，开始下载...`);

      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setDownloadProgress(Math.round(((i + 1) / totalFiles) * 100));
        setDownloadMessage(`正在下载 (${i + 1}/${totalFiles})：${file.fileName}`);
        await downloadBlob(file.blob, file.fileName);
        if (i < allFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      setDownloadMessage(`✓ 按狗狗拆分导出完成！共 ${totalFiles} 个文件`);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Export by dog error:', error);
      setDownloadMessage('导出失败，请重试');
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    }
  };

  if (records.length === 0) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-amber-800 mb-2">
              📤 数据导出
            </h1>
            <p className="text-amber-600 text-sm">
              导出数据用于沟通
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white/50 rounded-2xl"
          >
            <div className="text-6xl mb-4">📤</div>
            <p className="text-amber-700 font-medium">
              还没有数据可以导出
            </p>
            <p className="text-amber-500 text-sm mt-2">
              先去记录一些狗叫数据吧~
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-amber-800 mb-2">
            📤 数据导出
          </h1>
          <p className="text-amber-600 text-sm">
            导出数据，用于邻里平和沟通
          </p>
        </motion.div>

        {hasAudio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileAudio className="text-blue-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-blue-800">
                  检测到 {audioFiles.length} 条录音
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  导出时可选择附带录音文件，方便作为沟通证据
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-soft mb-6"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🐕</div>
            <h2 className="font-display text-2xl font-bold text-amber-800">
              狗叫记录分析报告
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              生成时间：{new Date().toLocaleString('zh-CN')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">
                {summaryStats.totalRecords}
              </div>
              <div className="text-sm text-amber-700">总记录次数</div>
            </div>
            <div className="bg-mint-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-mint-600">
                {summaryStats.dailyAverage.toFixed(1)}
              </div>
              <div className="text-sm text-mint-700">日均次数</div>
            </div>
          </div>

          {hasAudio && (
            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Music className="text-indigo-500" size={18} />
                <span className="font-medium text-indigo-800">录音证据</span>
              </div>
              <p className="text-indigo-700 text-sm">
                共绑定 <span className="font-bold">{audioFiles.length}</span> 条环境录音，可在导出时一并下载
              </p>
            </div>
          )}

          {peakHourInfo && (
            <div className="bg-coral-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-coral-500" size={18} />
                <span className="font-medium text-coral-800">高频时段预警</span>
              </div>
              <p className="text-coral-700">
                <span className="font-bold">{peakHourInfo.label}</span>（{peakHourInfo.period}）
                是狗叫最频繁的时段，共记录 {peakHourInfo.count} 次
              </p>
            </div>
          )}

          {peakDayInfo && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-blue-500" size={18} />
                <span className="font-medium text-blue-800">高频日期提示</span>
              </div>
              <p className="text-blue-700">
                <span className="font-bold">{WEEKDAYS[peakDayInfo.day]}</span>
                的狗叫次数相对较多
              </p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="font-medium text-gray-800 mb-3">24小时分布</h3>
            <div className="flex items-end h-24 gap-0.5">
              {chartData.map((item, index) => {
                const height =
                  maxHourlyCount > 0 ? (item.count / maxHourlyCount) * 100 : 0;
                return (
                  <div
                    key={item.hour}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      backgroundColor:
                        item.count === 0
                          ? '#FEF3C7'
                          : item.isPeak
                          ? '#EF4444'
                          : '#F59E0B',
                    }}
                    title={`${item.hour}时: ${item.count}次`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0时</span>
              <span>6时</span>
              <span>12时</span>
              <span>18时</span>
              <span>23时</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 text-center">
              📝 本报告由「狗叫记录器」自动生成，数据仅供邻里沟通参考
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat('text')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                exportFormat === 'text'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              文本格式
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                exportFormat === 'json'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Code2 size={18} />
              JSON 格式
            </button>
          </div>

          {hasAudio && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-soft cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <FileAudio className="text-indigo-600" size={18} />
                </div>
                <div>
                  <div className="font-medium text-gray-800">附带录音文件</div>
                  <div className="text-xs text-gray-500">
                    将单独下载 {audioFiles.length} 个音频文件 + 对应关系说明
                  </div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-7 rounded-full transition-colors ${
                    includeAudio ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: includeAudio ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
                  />
                </div>
              </div>
            </motion.label>
          )}

          <AnimatePresence>
            {isDownloading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="text-blue-500 animate-spin" size={20} />
                  <div className="flex-1 font-medium text-blue-800 text-sm truncate">
                    {downloadMessage || '正在处理...'}
                  </div>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ duration: 0.2 }}
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                  />
                </div>
                <div className="text-xs text-blue-600 mt-1 text-right">
                  {downloadProgress}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={isDownloading}
              className="flex-1 py-4 px-6 bg-mint-500 text-white rounded-xl font-medium hover:bg-mint-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-mint-200 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={20} />
                  复制到剪贴板
                </>
              )}
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex-1 py-4 px-6 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-50"
            >
              <Download size={20} />
              仅报告
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                正在导出...
              </>
            ) : (
              <>
                <Download size={20} />
                全部导出
                {hasAudio && includeAudio && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    报告 + {audioFiles.length} 录音
                  </span>
                )}
              </>
            )}
          </button>

          {hasAudio && (
            <button
              onClick={handleDownloadAudioOnly}
              disabled={isDownloading}
              className="w-full py-3 px-6 border-2 border-indigo-200 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Music size={18} />
              仅下载录音文件 ({audioFiles.length})
            </button>
          )}

          {dogs.length > 0 && (
            <button
              onClick={handleDownloadByDog}
              disabled={isDownloading}
              className="w-full py-3 px-6 border-2 border-amber-200 text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              按狗狗拆分导出 ({dogs.length} 只)
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200"
        >
          <h3 className="font-medium text-amber-800 mb-2">💡 沟通小贴士</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 保持友好态度，用数据说话而非情绪</li>
            <li>• 说明狗叫对你的具体影响（如影响睡眠）</li>
            {hasAudio && (
              <li>• 🎵 录音文件可作为客观证据，增强说服力</li>
            )}
            <li>• 可以提出建设性建议，共同寻找解决方案</li>
            <li>• 选择合适的时机沟通，避免对方忙碌时打扰</li>
          </ul>
        </motion.div>

        {hasAudio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-start gap-2">
              <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  <strong>浏览器限制说明：</strong>由于浏览器安全策略，无法直接打包下载为 ZIP 格式，将采用逐个文件下载的方式。
                </p>
                <p>
                  首次下载时，浏览器可能会提示「允许此网站下载多个文件」，请选择「允许」以获取完整的录音文件。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
