import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { TIME_PERIOD_OPTIONS, TimePeriodPreset, DateRange } from '@/types';
import { getDateRangeForPreset, formatDateRange } from '@/utils/date';

interface TimePeriodSelectorProps {
  label: string;
  selectedPreset: TimePeriodPreset;
  customStart?: number;
  customEnd?: number;
  onPresetChange: (preset: TimePeriodPreset) => void;
  onCustomRangeChange: (start: number, end: number) => void;
  color?: 'amber' | 'blue';
}

export function TimePeriodSelector({
  label,
  selectedPreset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomRangeChange,
  color = 'amber',
}: TimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const currentRange = getDateRangeForPreset(selectedPreset, customStart, customEnd);

  const colorClasses = {
    amber: {
      bg: 'bg-amber-500',
      border: 'border-amber-500',
      text: 'text-amber-600',
      lightBg: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-50',
    },
    blue: {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-50',
    },
  };

  const colors = colorClasses[color];

  const handlePresetSelect = (preset: TimePeriodPreset) => {
    onPresetChange(preset);
    if (preset === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
    setIsOpen(false);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const timestamp = new Date(value).getTime();
    if (type === 'start') {
      onCustomRangeChange(timestamp, customEnd || Date.now());
    } else {
      onCustomRangeChange(customStart || Date.now(), timestamp);
    }
  };

  return (
    <div className="relative">
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border-2 ${colors.border} ${colors.lightBg} flex items-center justify-between transition-all hover:shadow-md`}
      >
        <div className="flex items-center gap-2">
          <Calendar size={18} className={colors.text} />
          <span className={`font-medium ${colors.text}`}>{currentRange.label}</span>
        </div>
        <ChevronDown
          size={18}
          className={`${colors.text} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
        >
          {TIME_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => handlePresetSelect(option.key)}
              className={`w-full px-4 py-3 text-left text-sm transition-all ${
                selectedPreset === option.key
                  ? `${colors.bg} text-white`
                  : `${colors.hoverBg} text-gray-700`
              }`}
            >
              {option.label}
            </button>
          ))}

          {showCustomPicker && (
            <div className="p-4 border-t border-gray-100 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
                <input
                  type="date"
                  value={customStart ? new Date(customStart).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
                <input
                  type="date"
                  value={customEnd ? new Date(customEnd).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              {customStart && customEnd && (
                <div className="text-xs text-gray-400 text-center">
                  已选择: {formatDateRange(customStart, customEnd)}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
