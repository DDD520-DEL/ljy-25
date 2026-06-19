import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TagStats } from '@/types';

const CHART_COLORS = [
  '#F59E0B',
  '#EF4444',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#84CC16',
];

function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

interface TagPieChartProps {
  data: TagStats[];
  totalRecords: number;
}

const RADIAN = Math.PI / 180;

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) => {
  if (percent < 0.05) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function TagPieChart({ data, totalRecords }: TagPieChartProps) {
  const chartData = useMemo(() => {
    const taggedCount = data.reduce((sum, item) => sum + item.count, 0);
    const untaggedCount = totalRecords - taggedCount;

    const result = data.map((item, index) => ({
      name: item.tag,
      value: item.count,
      percentage: item.percentage,
      fill: getChartColor(index),
    }));

    if (untaggedCount > 0) {
      result.push({
        name: '未打标',
        value: untaggedCount,
        percentage: (untaggedCount / totalRecords) * 100,
        fill: '#9CA3AF',
      });
    }

    return result;
  }, [data, totalRecords]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-600">
            {item.value} 次 ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0 && totalRecords === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <div className="text-4xl mb-3">🏷️</div>
        <p className="text-gray-500">暂无标签数据</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-soft"
    >
      <h3 className="font-display text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        🏷️ 标签分布
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = entry.payload;
                return (
                  <span className="text-sm text-gray-700">
                    {value} ({item.value}次)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {chartData.slice(0, 4).map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-gray-700 truncate">{item.name}</span>
                <span className="text-gray-500 ml-auto">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
