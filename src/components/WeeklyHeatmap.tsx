import { useState } from 'react';
import { motion } from 'framer-motion';
import { WEEKDAY_SHORT } from '@/types';
import { formatHour } from '@/types';

interface HeatmapDataPoint {
  day: number;
  hour: number;
  count: number;
  dayLabel: string;
  hourLabel: string;
  intensity: number;
}

interface WeeklyHeatmapProps {
  data: HeatmapDataPoint[];
  maxCount: number;
}

export function WeeklyHeatmap({ data, maxCount }: WeeklyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  const getCellColor = (intensity: number, count: number) => {
    if (count === 0) return '#FFFBEB';
    if (intensity > 0.8) return '#DC2626';
    if (intensity > 0.6) return '#F59E0B';
    if (intensity > 0.4) return '#FBBF24';
    if (intensity > 0.2) return '#FCD34D';
    return '#FDE68A';
  };

  const displayHours = Array.from({ length: 24 }, (_, i) => i).filter(
    (h) => h % 3 === 0
  );

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft">
      <h3 className="font-display text-lg font-bold text-gray-800 mb-4">
        一周时段热力分布
      </h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex mb-2">
            <div className="w-10 flex-shrink-0" />
            {displayHours.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-gray-500"
              >
                {hour}时
              </div>
            ))}
          </div>

          {WEEKDAY_SHORT.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-10 text-sm text-gray-600 font-medium flex-shrink-0">
                {day}
              </div>
              {displayHours.map((hour) => {
                const cell = data.find(
                  (d) => d.day === dayIndex && d.hour === hour
                );
                const intensity = cell?.intensity || 0;
                const count = cell?.count || 0;

                return (
                  <motion.div
                    key={`${dayIndex}-${hour}`}
                    className="flex-1 h-8 mx-0.5 rounded cursor-pointer relative"
                    style={{
                      backgroundColor: getCellColor(intensity, count),
                    }}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                    onMouseEnter={() => setHoveredCell(cell || null)}
                    onMouseLeave={() => setHoveredCell(null)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: (dayIndex * 8 + hour / 3) * 0.02,
                    }}
                  >
                    {count > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {count}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hoveredCell && hoveredCell.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-amber-50 rounded-lg"
        >
          <div className="text-sm text-gray-700">
            <span className="font-medium">
              周{WEEKDAY_SHORT[hoveredCell.day]} {hoveredCell.hourLabel}
            </span>
            <span className="mx-2">·</span>
            <span className="text-amber-600 font-bold">
              {hoveredCell.count} 次
            </span>
          </div>
        </motion.div>
      )}

      {!hoveredCell && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
          悬停查看详细数据
        </div>
      )}
    </div>
  );
}
