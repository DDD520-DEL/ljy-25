import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DailyActiveData } from '@/types';
import { BarChart2, Activity, Users, UserPlus, FileText, BarChart3 } from 'lucide-react';

interface DailyActiveTrendChartProps {
  data: DailyActiveData[];
}

type ChartType = 'area' | 'line';
type MetricType = 'activeUsers' | 'newUsers' | 'totalRecords' | 'all';

export function DailyActiveTrendChart({ data }: DailyActiveTrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [metric, setMetric] = useState<MetricType>('all');

  const hasData = data.some(
    (item) => item.activeUsers > 0 || item.newUsers > 0 || item.totalRecords > 0
  );

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      dateLabel: item.date.slice(5),
      活跃用户: item.activeUsers,
      新增用户: item.newUsers,
      记录数: item.totalRecords,
    }));
  }, [data]);

  const metricConfig = {
    activeUsers: {
      label: '活跃用户',
      color: '#10B981',
      icon: <Activity size={14} />,
    },
    newUsers: {
      label: '新增用户',
      color: '#8B5CF6',
      icon: <UserPlus size={14} />,
    },
    totalRecords: {
      label: '记录数',
      color: '#F59E0B',
      icon: <FileText size={14} />,
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs mb-1"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    if (chartType === 'area' && metric === 'all') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="活跃用户"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActive)"
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="新增用户"
            stroke="#8B5CF6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNew)"
            animationDuration={1200}
          />
          <Area
            type="monotone"
            dataKey="记录数"
            stroke="#F59E0B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRecords)"
            animationDuration={1400}
          />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          {(metric === 'all' || metric === 'activeUsers') && (
            <Line
              type="monotone"
              dataKey="活跃用户"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          )}
          {(metric === 'all' || metric === 'newUsers') && (
            <Line
              type="monotone"
              dataKey="新增用户"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1200}
            />
          )}
          {(metric === 'all' || metric === 'totalRecords') && (
            <Line
              type="monotone"
              dataKey="记录数"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1400}
            />
          )}
        </LineChart>
      );
    }

    const selectedKey =
      metric === 'activeUsers'
        ? '活跃用户'
        : metric === 'newUsers'
        ? '新增用户'
        : '记录数';
    const selectedColor =
      metric === 'activeUsers'
        ? '#10B981'
        : metric === 'newUsers'
        ? '#8B5CF6'
        : '#F59E0B';
    const gradientId = `color${metric}`;

    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={selectedColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={selectedColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={selectedKey}
          stroke={selectedColor}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
          animationDuration={1000}
        />
      </AreaChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 mb-6"
    >
      <div className="p-5 border-b border-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart2 className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">
                日活跃趋势
              </h3>
              <p className="text-xs text-gray-500">
                展示活跃用户、新增用户和记录数的每日变化趋势
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                面积图
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartType === 'line'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                折线图
              </button>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMetric('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  metric === 'all'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                全部
              </button>
              {(Object.keys(metricConfig) as MetricType[])
                .filter((k) => k !== 'all')
                .map((key) => (
                  <button
                    key={key}
                    onClick={() => setMetric(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      metric === key
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {metricConfig[key].icon}
                    {metricConfig[key].label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">
        {!hasData ? (
          <div className="h-80 flex flex-col items-center justify-center text-gray-400">
            <BarChart3 size={48} className="mb-3 opacity-30" />
            <p className="text-base font-medium text-gray-400 mb-1">暂无趋势数据</p>
            <p className="text-sm text-gray-300">当前日期范围内没有用户活动记录</p>
            <p className="text-xs text-gray-300 mt-2">当用户注册并产生记录后，日活跃趋势将在此展示</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
