import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Tag,
  Filter,
  Check,
  CheckSquare,
  Square,
  MapPin,
  X,
  Info,
} from 'lucide-react';
import { RecordItem } from '@/components/RecordItem';
import { TagSelector } from '@/components/TagSelector';
import { useBarkRecords } from '@/hooks/useBarkRecords';
import { getAllTags, filterRecordsByTags, groupRecordsByDate } from '@/utils/statistics';
import { formatFriendlyDate } from '@/utils/date';
import { getTagColorClasses } from '@/lib/utils';


type BatchActionType = 'location' | 'tags' | 'delete' | null;

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function RecordsPage() {
  const {
    records,
    deleteRecord,
    updateRecord,
    clearAllRecords,
    batchUpdateRecords,
    batchDeleteRecords,
    batchAddTags,
  } = useBarkRecords();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchAll, setTagMatchAll] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [batchAction, setBatchAction] = useState<BatchActionType>(null);
  const [batchLocation, setBatchLocation] = useState('');
  const [batchTags, setBatchTags] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const allTags = useMemo(() => getAllTags(records), [records]);

  const filteredRecords = useMemo(() => {
    let result = records;

    if (selectedTags.length > 0) {
      result = filterRecordsByTags(result, selectedTags, tagMatchAll);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.location?.toLowerCase().includes(query) ||
          r.dogDescription?.toLowerCase().includes(query) ||
          r.note?.toLowerCase().includes(query) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [records, selectedTags, tagMatchAll, searchQuery]);

  const filteredRecordIds = useMemo<Set<string>>(
    () => new Set(filteredRecords.map((r) => r.id)),
    [filteredRecords]
  );
  const allFilteredSelected = useMemo(
    () =>
      filteredRecords.length > 0 &&
      filteredRecords.every((r) => selectedRecordIds.has(r.id)),
    [filteredRecords, selectedRecordIds]
  );


  const showToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectRecord = (id: string, selected: boolean) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        filteredRecordIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        filteredRecordIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedRecordIds(new Set());
    } else {
      setSelectionMode(true);
    }
  };

  const clearSelection = () => {
    setSelectedRecordIds(new Set());
  };

  const handleBatchActionClick = (action: BatchActionType) => {
    if (selectedRecordIds.size === 0) {
      showToast('info', '请先选择要操作的记录');
      return;
    }
    setBatchAction(action);
    setBatchLocation('');
    setBatchTags([]);
  };

  const handleBatchActionConfirm = () => {
    const ids = Array.from(selectedRecordIds);

    switch (batchAction) {
      case 'location': {
        const trimmed = batchLocation.trim();
        if (!trimmed) {
          showToast('error', '请输入位置信息');
          return;
        }
        const updated = batchUpdateRecords(ids, { location: trimmed });
        showToast('success', `已成功更新 ${updated} 条记录的位置`);
        break;
      }
      case 'tags': {
        if (batchTags.length === 0) {
          showToast('error', '请选择至少一个标签');
          return;
        }
        const updated = batchAddTags(ids, batchTags);
        showToast('success', `已为 ${updated} 条记录添加标签`);
        break;
      }
      case 'delete': {
        const deleted = batchDeleteRecords(ids);
        showToast('success', `已成功删除 ${deleted} 条记录`);
        break;
      }
    }

    setBatchAction(null);
    clearSelection();
  };

  const handleBatchActionCancel = () => {
    setBatchAction(null);
    setBatchLocation('');
    setBatchTags([]);
  };

  useEffect(() => {
    const existingIds = new Set(records.map((r) => r.id));
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      next.forEach((id) => {
        if (!existingIds.has(id)) {
          next.delete(id);
        }
      });
      return next;
    });
  }, [records]);

  const filteredGroups = useMemo(() => {
    return groupRecordsByDate(filteredRecords);
  }, [filteredRecords]);

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
              {selectionMode && selectedRecordIds.size > 0 && (
                <span className="ml-2 text-amber-700 font-medium">
                  · 已选 {selectedRecordIds.size} 条
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectionMode
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title={selectionMode ? '完成选择' : '批量选择'}
              >
                {selectionMode ? (
                  <Check size={16} />
                ) : (
                  <CheckSquare size={16} />
                )}
                {selectionMode ? '完成' : '选择'}
              </button>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
              title="清空所有记录"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </motion.div>

        {selectionMode && selectedRecordIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                <CheckSquare size={16} />
                <span>已选择 {selectedRecordIds.size} 条记录</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleBatchActionClick('location')}
                  className="px-3 py-1.5 text-sm bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                >
                  <MapPin size={14} />
                  修改位置
                </button>
                <button
                  onClick={() => handleBatchActionClick('tags')}
                  className="px-3 py-1.5 text-sm bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                >
                  <Tag size={14} />
                  打标签
                </button>
                <button
                  onClick={() => handleBatchActionClick('delete')}
                  className="px-3 py-1.5 text-sm bg-white border border-coral-300 text-coral-600 rounded-lg hover:bg-coral-50 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  批量删除
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex-1"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="搜索备注、位置、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-3 bg-white border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm ${
                selectedRecordIds.size > 0 ? 'pl-10 pr-12' : 'pl-10 pr-12'
              }`}
            />
            {allTags.length > 0 && (
              <button
                onClick={() => setShowTagFilter(prev => !prev)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  selectedTags.length > 0 ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
                title="标签筛选"
              >
                <Filter size={18} />
              </button>
            )}
          </motion.div>

          <AnimatePresence>
            {selectionMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleSelectAllFiltered}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-colors ${
                  allFilteredSelected
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                }`}
                title={
                  allFilteredSelected ? '取消全选' : '全选当前筛选结果'
                }
              >
                {allFilteredSelected ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                <span className="text-sm font-medium">全选</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showTagFilter && allTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag size={16} className="text-amber-600" />
                    按标签筛选
                  </div>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-gray-400 hover:text-coral-600 transition-colors"
                    >
                      清除筛选
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    const colorClasses = getTagColorClasses(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                          isSelected
                            ? colorClasses.replace('100', '500').replace('800', 'white').replace('200', '500')
                            : `${colorClasses} opacity-60 hover:opacity-100`
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">匹配模式：</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={!tagMatchAll}
                      onChange={() => setTagMatchAll(false)}
                      className="w-4 h-4 text-amber-500"
                    />
                    <span className="text-gray-700">任意标签</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={tagMatchAll}
                      onChange={() => setTagMatchAll(true)}
                      className="w-4 h-4 text-amber-500"
                    />
                    <span className="text-gray-700">全部标签</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-gray-500">已选标签：</span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getTagColorClasses(tag)}`}
              >
                {tag}
                <button
                  onClick={() =>
                    setSelectedTags((prev) => prev.filter((t) => t !== tag))
                  }
                  className="ml-1 hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
            <span className="text-sm text-gray-400 ml-2">
              ({filteredRecords.length} 条匹配)
            </span>
          </motion.div>
        )}

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
                <div className="flex items-stretch">
                  {selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const allSelected = dayRecords.every((r) =>
                          selectedRecordIds.has(r.id)
                        );
                        setSelectedRecordIds((prev) => {
                          const next = new Set(prev);
                          dayRecords.forEach((r) => {
                            if (allSelected) {
                              next.delete(r.id);
                            } else {
                              next.add(r.id);
                            }
                          });
                          return next;
                        });
                      }}
                      className="px-2 bg-amber-100 hover:bg-amber-200 border-r border-amber-200 transition-colors"
                      title={
                        dayRecords.every((r) => selectedRecordIds.has(r.id))
                          ? '取消选择当天记录'
                          : '选择当天所有记录'
                      }
                    >
                      {dayRecords.every((r) => selectedRecordIds.has(r.id)) ? (
                        <CheckSquare size={16} className="text-amber-700" />
                      ) : dayRecords.some((r) => selectedRecordIds.has(r.id)) ? (
                        <CheckSquare size={16} className="text-amber-500 opacity-60" />
                      ) : (
                        <Square size={16} className="text-amber-500" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => toggleDate(date)}
                    className="flex-1 px-4 py-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
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
                </div>

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
                              selectable={selectionMode}
                              selected={selectedRecordIds.has(record.id)}
                              onSelect={handleSelectRecord}
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

        {batchAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBatchActionCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    batchAction === 'delete' ? 'bg-coral-100' : 'bg-amber-100'
                  }`}
                >
                  {batchAction === 'location' && (
                    <MapPin className="text-amber-600" size={24} />
                  )}
                  {batchAction === 'tags' && (
                    <Tag className="text-amber-600" size={24} />
                  )}
                  {batchAction === 'delete' && (
                    <AlertTriangle className="text-coral-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {batchAction === 'location' && '批量修改位置'}
                    {batchAction === 'tags' && '批量添加标签'}
                    {batchAction === 'delete' && '确认批量删除'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    影响 {selectedRecordIds.size} 条记录
                  </p>
                </div>
              </div>

              <div className="mb-6">
                {batchAction === 'location' && (
                  <div>
                    <p className="text-gray-600 mb-3">
                      将为选中的 {selectedRecordIds.size} 条记录设置新位置：
                    </p>
                    <input
                      type="text"
                      placeholder="输入新位置（如：3号楼东侧）"
                      value={batchLocation}
                      onChange={(e) => setBatchLocation(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      autoFocus
                    />
                  </div>
                )}

                {batchAction === 'tags' && (
                  <div>
                    <p className="text-gray-600 mb-3">
                      将为选中的 {selectedRecordIds.size} 条记录添加以下标签（不会移除已有标签）：
                    </p>
                    <TagSelector
                      selectedTags={batchTags}
                      onChange={setBatchTags}
                      availableTags={allTags}
                      placeholder="输入自定义标签..."
                    />
                  </div>
                )}

                {batchAction === 'delete' && (
                  <div className="bg-coral-50 border border-coral-200 rounded-xl p-4">
                    <p className="text-coral-700 font-medium mb-2">
                      ⚠️ 此操作不可恢复
                    </p>
                    <p className="text-coral-600 text-sm">
                      确定要删除选中的 {selectedRecordIds.size} 条记录吗？
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBatchActionCancel}
                  className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchActionConfirm}
                  className={`flex-1 py-2.5 px-4 text-white rounded-xl transition-colors ${
                    batchAction === 'delete'
                      ? 'bg-coral-500 hover:bg-coral-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {batchAction === 'location' && '确认修改'}
                  {batchAction === 'tags' && '确认添加'}
                  {batchAction === 'delete' && '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
            style={{ marginTop: `${index * 56}px` }}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] ${
                toast.type === 'success'
                  ? 'bg-green-500 text-white'
                  : toast.type === 'error'
                  ? 'bg-coral-500 text-white'
                  : 'bg-gray-800 text-white'
              }`}
            >
              {toast.type === 'success' && <Check size={18} />}
              {toast.type === 'error' && <X size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-0.5 hover:bg-white/20 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
