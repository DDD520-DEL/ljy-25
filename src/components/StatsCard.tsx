import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'amber' | 'mint' | 'coral' | 'blue';
  delay?: number;
}

const colorClasses = {
  amber: 'bg-amber-100 text-amber-600',
  mint: 'bg-mint-100 text-mint-600',
  coral: 'bg-coral-100 text-coral-600',
  blue: 'bg-blue-100 text-blue-600',
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'amber',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className={cn('p-3 rounded-xl', colorClasses[color])}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-gray-500 text-sm mb-1">{label}</div>
        <div className="font-display text-2xl font-bold text-gray-800">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-gray-400 mt-0.5">{subValue}</div>
        )}
      </div>
    </motion.div>
  );
}
