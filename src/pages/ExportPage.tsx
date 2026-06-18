import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Copy,
  Download,
  Check,
  FileText,
  Image,
  AlertCircle,
} from 'lucide-react';
import { useBarkRecords } from '@/hooks/useBarkRecords';
import { useStats } from '@/hooks/useStats';
import { exportRecordsAsText } from '@/utils/storage';
import { WEEKDAYS, getTimePeriod } from '@/types';
import { formatFriendlyDate } from '@/utils/date';

export function ExportPage() {
  const { records } = useBarkRecords();
  const { summaryStats, peakHourInfo, peakDayInfo, chartData, maxHourlyCount } =
    useStats();
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'text' | 'json'>('text');
  const reportRef = useRef<HTMLDivElement>(null);

  const textReport = useMemo(() => {
    return exportRecordsAsText(records);
  }, [records]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `狗叫记录_${new Date().toLocaleDateString('zh-CN')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `狗叫记录_${new Date().toLocaleDateString('zh-CN')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          ref={reportRef}
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
              <Image size={18} />
              JSON 格式
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyText}
              className="flex-1 py-4 px-6 bg-mint-500 text-white rounded-xl font-medium hover:bg-mint-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-mint-200"
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
              onClick={exportFormat === 'text' ? handleDownloadText : handleDownloadJSON}
              className="flex-1 py-4 px-6 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              <Download size={20} />
              下载文件
            </button>
          </div>
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
            <li>• 可以提出建设性建议，共同寻找解决方案</li>
            <li>• 选择合适的时机沟通，避免对方忙碌时打扰</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
