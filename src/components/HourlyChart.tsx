import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatHour, getTimePeriod } from '@/types';

interface ChartDataPoint {
  hour: number;
  hourLabel: string;
  count: number;
  isPeak: boolean;
}

interface HourlyChartProps {
  data: ChartDataPoint[];
  maxCount: number;
}

export function HourlyChart({ data, maxCount }: HourlyChartProps) {
  const [activeHour, setActiveHour] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      displayHour: item.hour % 3 === 0 ? `${item.hour}时` : '',
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { hour, count } = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-amber-100">
          <div className="font-medium text-gray-800">
            {formatHour(hour)} - {getTimePeriod(hour)}
          </div>
          <div className="text-amber-600 font-bold">
            {count} 次
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (entry: ChartDataPoint, index: number) => {
    if (activeHour === index) return '#F59E0B';
    if (entry.isPeak) return '#EF4444';
    if (entry.count === 0) return '#FEF3C7';
    const intensity = maxCount > 0 ? entry.count / maxCount : 0;
    if (intensity > 0.7) return '#F59E0B';
    if (intensity > 0.3) return '#FCD34D';
    return '#FDE68A';
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft">
      <h3 className="font-display text-lg font-bold text-gray-800 mb-4">
        24小时狗叫频次分布
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setActiveHour(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveHour(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#FEF3C7"
              vertical={false}
            />
            <XAxis
              dataKey="displayHour"
              tick={{ fontSize: 12, fill: '#92400E' }}
              axisLine={{ stroke: '#FDE68A' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#92400E' }}
              axisLine={{ stroke: '#FDE68A' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
              animationBegin={200}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry, index)}
                  className="transition-all duration-200"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-200" />
          <span className="text-gray-500">较少</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-gray-500">中等</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-gray-500">较多</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral-500" />
          <span className="text-gray-500">峰值</span>
        </div>
      </div>
    </div>
  );
}
