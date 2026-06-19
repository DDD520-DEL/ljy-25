import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import { RegionData } from '@/types';
import {
  MapPin,
  Users,
  FileText,
  TrendingUp,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface RegionDistributionMapProps {
  data: RegionData[];
}

type SortField = 'userCount' | 'recordCount' | 'province';
type SortOrder = 'asc' | 'desc';

export function RegionDistributionMap({ data }: RegionDistributionMapProps) {
  const [sortField, setSortField] = useState<SortField>('recordCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: item.city,
      x: item.lng,
      y: item.lat,
      z: item.recordCount,
      size: Math.sqrt(item.recordCount) * 2 + 10,
    }));
  }, [data]);

  const sortedData = useMemo(() => {
    let filtered = data.filter(
      (item) =>
        item.province.includes(searchTerm) ||
        item.city.includes(searchTerm)
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'userCount') {
        comparison = a.userCount - b.userCount;
      } else if (sortField === 'recordCount') {
        comparison = a.recordCount - b.recordCount;
      } else {
        comparison = a.province.localeCompare(b.province, 'zh-CN');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getColor = (index: number) => {
    const colors = [
      '#F59E0B',
      '#10B981',
      '#8B5CF6',
      '#EF4444',
      '#3B82F6',
      '#EC4899',
      '#06B6D4',
      '#F97316',
    ];
    return colors[index % colors.length];
  };

  const totalUsers = data.reduce((sum, item) => sum + item.userCount, 0);
  const totalRecords = data.reduce((sum, item) => sum + item.recordCount, 0);
  const topRegion = sortedData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
          <p className="text-sm font-medium text-gray-800 mb-2">
            {item.province} · {item.city}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Users size={12} className="text-indigo-500" />
              <span className="text-gray-500">用户数:</span>
              <span className="font-medium text-indigo-600">
                {item.userCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FileText size={12} className="text-amber-500" />
              <span className="text-gray-500">记录数:</span>
              <span className="font-medium text-amber-600">
                {item.recordCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100"
    >
      <div className="p-5 border-b border-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MapPin className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">
                地域分布
              </h3>
              <p className="text-xs text-gray-500">
                各地区用户和记录分布情况
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
              <Users size={14} className="text-indigo-600" />
              <span className="text-xs text-indigo-700 font-medium">
                覆盖 {data.length} 个城市
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
              <TrendingUp size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">
                {topRegion?.city || '-'} 最活跃
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">覆盖用户总数</div>
            <div className="text-xl font-display font-bold text-indigo-600">
              {totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">记录总数</div>
            <div className="text-xl font-display font-bold text-amber-600">
              {totalRecords.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">城市平均记录</div>
            <div className="text-xl font-display font-bold text-emerald-600">
              {data.length > 0
                ? Math.round(totalRecords / data.length).toLocaleString()
                : 0}
            </div>
          </div>
        </div>

        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                type="number"
                dataKey="x"
                name="经度"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                label={{
                  value: '经度',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 10, fill: '#9CA3AF' },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="纬度"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                label={{
                  value: '纬度',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: '#9CA3AF' },
                }}
              />
              <ZAxis
                type="number"
                dataKey="size"
                range={[30, 300]}
                name="记录数"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="城市" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(index)}
                    fillOpacity={0.6}
                    stroke={getColor(index)}
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="搜索省份或城市..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left">
                <button
                  onClick={() => handleSort('province')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  地区
                  {sortField === 'province' && (
                    <ArrowUpDown
                      size={12}
                      className={sortOrder === 'asc' ? '' : ''}
                    />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button
                  onClick={() => handleSort('userCount')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors ml-auto"
                >
                  用户数
                  {sortField === 'userCount' && (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-right">
                <button
                  onClick={() => handleSort('recordCount')}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors ml-auto"
                >
                  记录数
                  {sortField === 'recordCount' && (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                人均记录
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">
                占比
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <motion.tr
                key={`${item.province}-${item.city}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getColor(index) }}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {item.province}
                    </span>
                    <span className="text-sm text-gray-500">· {item.city}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-sm font-medium text-indigo-600">
                    {item.userCount.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-sm font-medium text-amber-600">
                    {item.recordCount.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="text-sm text-gray-600">
                    {item.userCount > 0
                      ? (item.recordCount / item.userCount).toFixed(1)
                      : 0}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.recordCount / totalRecords) * 100
                          )}%`,
                          backgroundColor: getColor(index),
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10">
                      {totalRecords > 0
                        ? ((item.recordCount / totalRecords) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
