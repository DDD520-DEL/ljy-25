import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  TagRecordDistribution,
  MULTI_TAG_KEY,
  UNTAGGED_KEY,
} from '@/utils/statistics';

const TAG_COLORS = [
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

const MULTI_TAG_COLOR = '#64748B';
const UNTAGGED_COLOR = '#9CA3AF';

const DISPLAY_NAMES: Record<string, string> = {
  [MULTI_TAG_KEY]: '多标签',
  [UNTAGGED_KEY]: '未打标',
};

function getChartColor(tag: string, index: number): string {
  if (tag === MULTI_TAG_KEY) return MULTI_TAG_COLOR;
  if (tag === UNTAGGED_KEY) return UNTAGGED_COLOR;
  return TAG_COLORS[index % TAG_COLORS.length];
}

function getDisplayName(tag: string): string {
  return DISPLAY_NAMES[tag] || tag;
}

interface TagPieChartProps {
  data: TagRecordDistribution[];
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
    let colorIndex = 0;
    return data.map((item) => {
      const isSpecial = item.tag === MULTI_TAG_KEY || item.tag === UNTAGGED_KEY;
      const fill = isSpecial
        ? getChartColor(item.tag, 0)
        : getChartColor(item.tag, colorIndex++);

      return {
        key: item.tag,
        name: getDisplayName(item.tag),
        value: item.count,
        percentage: item.percentage,
        fill,
      };
    });
  }, [data]);

  const actualTotal = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-600">
            {item.value} 条 ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <div className="text-4xl mb-3">🏷️</div>
        <p className="text-gray-500">暂无标签数据</p>
      </div>
    );
  }

  const untaggedItem = data.find((d) => d.tag === UNTAGGED_KEY);
  const multiTagItem = data.find((d) => d.tag === MULTI_TAG_KEY);
  const singleTagItems = data.filter(
    (d) => d.tag !== UNTAGGED_KEY && d.tag !== MULTI_TAG_KEY
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-soft"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-gray-800 flex items-center gap-2">
          🏷️ 标签分布
        </h3>
        <span className="text-xs text-gray-400">
          共 {totalRecords} 条{actualTotal !== totalRecords && ` (实际 ${actualTotal})`}
        </span>
      </div>

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
                    {value} ({item.value}条)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {(singleTagItems.length > 0 || multiTagItem || untaggedItem) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            {singleTagItems.slice(0, 2).map((item, index) => (
              <div key={item.tag} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getChartColor(item.tag, index) }}
                />
                <span className="text-gray-700 truncate">
                  {getDisplayName(item.tag)}
                </span>
                <span className="text-gray-500 ml-auto">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
            {multiTagItem && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MULTI_TAG_COLOR }}
                />
                <span className="text-gray-700 truncate">多标签</span>
                <span className="text-gray-500 ml-auto">
                  {multiTagItem.percentage.toFixed(0)}%
                </span>
              </div>
            )}
            {untaggedItem && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: UNTAGGED_COLOR }}
                />
                <span className="text-gray-700 truncate">未打标</span>
                <span className="text-gray-500 ml-auto">
                  {untaggedItem.percentage.toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {multiTagItem && (
            <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>
                「多标签」包含 {multiTagItem.count} 条打了 2 个及以上标签的记录
                {untaggedItem &&
                  `，「未打标」包含 ${untaggedItem.count} 条未打标签的记录`}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
