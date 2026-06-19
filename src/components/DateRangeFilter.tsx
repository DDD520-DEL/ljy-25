import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { ADMIN_DATE_RANGE_OPTIONS, AdminDateRange } from '@/types';

interface DateRangeFilterProps {
  currentRange: AdminDateRange;
  currentKey: string;
  onChange: (key: string, customRange?: AdminDateRange) => void;
  customStartDate: string;
  customEndDate: string;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  onApplyCustom: () => void;
}

export function DateRangeFilter({
  currentRange,
  currentKey,
  onChange,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
  onApplyCustom,
}: DateRangeFilterProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 mb-6"
    >
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">数据范围</h3>
              <p className="text-xs text-gray-500">
                {formatDate(currentRange.start)} - {formatDate(currentRange.end)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {ADMIN_DATE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    if (option.key !== 'custom') {
                      onChange(option.key);
                    } else {
                      onChange(option.key);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentKey === option.key
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {currentKey === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 font-medium">
                      开始日期
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 font-medium">
                      结束日期
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    onClick={onApplyCustom}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
                  >
                    应用筛选
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
