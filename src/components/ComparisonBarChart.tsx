import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatHour, getTimePeriod } from '@/types';
import { ComparisonStats } from '@/types';

interface ComparisonBarChartProps {
  data: ComparisonStats;
}

export function ComparisonBarChart({ data }: ComparisonBarChartProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data.period1.hourly.map((stat1, index) => {
      const stat2 = data.period2.hourly[index];
      return {
        hour: stat1.hour,
        hourLabel: `${stat1.hour}时`,
        displayHour: stat1.hour % 3 === 0 ? `${stat1.hour}时` : '',
        period1: stat1.count,
        period2: stat2 ? stat2.count : 0,
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { hour: number; period1: number; period2: number } }[] }) => {
    if (active && payload && payload.length) {
      const { hour, period1, period2 } = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-100 min-w-[180px]">
          <div className="font-bold text-gray-800 mb-2">
            {formatHour(hour)} - {getTimePeriod(hour)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-600">{data.period1Label}</span>
              </div>
              <span className="font-bold text-amber-600">{period1} 次</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">{data.period2Label}</span>
              </div>
              <span className="font-bold text-blue-600">{period2} 次</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">差值</span>
                <span className={`font-bold ${period1 >= period2 ? 'text-amber-600' : 'text-blue-600'}`}>
                  {period1 >= period2 ? '+' : ''}{period1 - period2} 次
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const maxCount = data.maxHourlyCount || 1;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft">
      <h3 className="font-display text-lg font-bold text-gray-800 mb-4">
        24小时叫唤频次对比
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setActiveBar(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveBar(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="displayHour"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
              iconType="circle"
            />
            <Bar
              dataKey="period1"
              name={data.period1Label}
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              opacity={activeBar === null || activeBar === undefined ? 1 : 0.5}
              activeBar={{ opacity: 1, fill: '#D97706' }}
            />
            <Bar
              dataKey="period2"
              name={data.period2Label}
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationBegin={200}
              opacity={activeBar === null || activeBar === undefined ? 1 : 0.5}
              activeBar={{ opacity: 1, fill: '#2563EB' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-gray-500">{data.period1Label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-500">{data.period2Label}</span>
        </div>
      </div>
    </div>
  );
}
