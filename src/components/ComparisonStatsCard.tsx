import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ComparisonStatsCardProps {
  icon: LucideIcon;
  label: string;
  value1: string | number;
  value2: string | number;
  subValue1?: string;
  subValue2?: string;
  color1?: 'amber' | 'blue' | 'coral' | 'mint';
  color2?: 'amber' | 'blue' | 'coral' | 'mint';
  label1: string;
  label2: string;
  showTrend?: boolean;
}

const colorClasses: Record<string, { bg: string; text: string; lightBg: string }> = {
  amber: {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    lightBg: 'bg-amber-50',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
  },
  coral: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50',
  },
  mint: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
  },
};

export function ComparisonStatsCard({
  icon: Icon,
  label,
  value1,
  value2,
  subValue1,
  subValue2,
  color1 = 'amber',
  color2 = 'blue',
  label1,
  label2,
  showTrend = true,
}: ComparisonStatsCardProps) {
  const colors1 = colorClasses[color1];
  const colors2 = colorClasses[color2];

  const numValue1 = typeof value1 === 'number' ? value1 : parseFloat(String(value1)) || 0;
  const numValue2 = typeof value2 === 'number' ? value2 : parseFloat(String(value2)) || 0;
  const diff = numValue1 - numValue2;
  const diffPercent = numValue2 > 0 ? ((numValue1 - numValue2) / numValue2) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-soft"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-xl ${colors1.lightBg}`}>
          <Icon size={18} className={colors1.text} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl ${colors1.lightBg}`}>
          <div className="text-xs text-gray-500 mb-1">{label1}</div>
          <div className={`text-2xl font-bold ${colors1.text}`}>{value1}</div>
          {subValue1 && <div className="text-xs text-gray-400 mt-1">{subValue1}</div>}
        </div>
        <div className={`p-3 rounded-xl ${colors2.lightBg}`}>
          <div className="text-xs text-gray-500 mb-1">{label2}</div>
          <div className={`text-2xl font-bold ${colors2.text}`}>{value2}</div>
          {subValue2 && <div className="text-xs text-gray-400 mt-1">{subValue2}</div>}
        </div>
      </div>

      {showTrend && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">变化趋势</span>
            <div className="flex items-center gap-1">
              {diff > 0 ? (
                <>
                  <span className="text-amber-500 text-sm">↑</span>
                  <span className="text-amber-600 text-sm font-medium">
                    +{diff.toFixed(1)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                  </span>
                </>
              ) : diff < 0 ? (
                <>
                  <span className="text-emerald-500 text-sm">↓</span>
                  <span className="text-emerald-600 text-sm font-medium">
                    {diff.toFixed(1)} ({diffPercent.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm font-medium">无变化</span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
