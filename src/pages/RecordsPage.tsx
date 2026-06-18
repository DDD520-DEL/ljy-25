import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List,
  Search,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { RecordItem } from '@/components/RecordItem';
import { useBarkRecords } from '@/hooks/useBarkRecords';
import { formatFriendlyDate } from '@/utils/date';

export function RecordsPage() {
  const { records, groupedRecords, deleteRecord, updateRecord, clearAllRecords } =
    useBarkRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedRecords;
    }

    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, typeof records>();

    groupedRecords.forEach((records, date) => {
      const matches = records.filter(
        (r) =>
          r.location?.toLowerCase().includes(query) ||
          r.dogDescription?.toLowerCase().includes(query) ||
          r.note?.toLowerCase().includes(query)
      );
      if (matches.length > 0) {
        filtered.set(date, matches);
      }
    });

    return filtered;
  }, [groupedRecords, searchQuery]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    clearAllRecords();
    setShowClearConfirm(false);
    setExpandedDates(new Set());
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
              📝 记录管理
            </h1>
            <p className="text-amber-600 text-sm">
              查看和编辑所有记录
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white/50 rounded-2xl"
          >
            <div className="text-6xl mb-4">📋</div>
            <p className="text-amber-700 font-medium">
              还没有任何记录
            </p>
            <p className="text-amber-500 text-sm mt-2">
              去首页开始记录吧~
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
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-amber-800 mb-1">
              📝 记录管理
            </h1>
            <p className="text-amber-600 text-sm">
              共 {records.length} 条记录
            </p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
            title="清空所有记录"
          >
            <Trash2 size={20} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="搜索备注、位置..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
        </motion.div>

        {filteredGroups.size === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/50 rounded-2xl"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500">没有找到匹配的记录</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {Array.from(filteredGroups.entries()).map(([date, dayRecords], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + groupIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-soft overflow-hidden"
              >
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-amber-600" />
                    <span className="font-medium text-gray-800">
                      {formatFriendlyDate(dayRecords[0].timestamp)}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                      {dayRecords.length} 次
                    </span>
                  </div>
                  {expandedDates.has(date) ? (
                    <ChevronUp size={18} className="text-amber-600" />
                  ) : (
                    <ChevronDown size={18} className="text-amber-600" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedDates.has(date) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-2">
                        {dayRecords.map((record, index) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <RecordItem
                              record={record}
                              onDelete={deleteRecord}
                              onUpdate={updateRecord}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center">
                  <AlertTriangle className="text-coral-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">确认清空</h3>
                  <p className="text-sm text-gray-500">此操作不可恢复</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                确定要清空所有 {records.length} 条记录吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 px-4 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors"
                >
                  确认清空
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
