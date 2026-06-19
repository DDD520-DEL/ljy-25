import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Thermometer,
  RefreshCw,
  AlertCircle,
  Info,
  Loader2,
  Flame,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  NearbyHeatmapData,
  HeatmapGridCell,
  GeoLocation,
} from '@/types';
import {
  formatGridLabel,
  getGridSizeMeters,
} from '@/services/locationService';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import * as heatmapService from '@/services/heatmapService';

interface NearbyHeatmapProps {
  className?: string;
  onLocationRequired?: () => void;
}

const HEATMAP_COLORS = [
  { intensity: 0, color: 'rgba(34, 197, 94, 0.1)' },
  { intensity: 0.2, color: 'rgba(34, 197, 94, 0.4)' },
  { intensity: 0.4, color: 'rgba(234, 179, 8, 0.5)' },
  { intensity: 0.6, color: 'rgba(249, 115, 22, 0.6)' },
  { intensity: 0.8, color: 'rgba(239, 68, 68, 0.7)' },
  { intensity: 1, color: 'rgba(220, 38, 38, 0.85)' },
];

function getHeatmapColor(intensity: number): string {
  for (let i = HEATMAP_COLORS.length - 1; i >= 0; i--) {
    if (intensity >= HEATMAP_COLORS[i].intensity) {
      return HEATMAP_COLORS[i].color;
    }
  }
  return HEATMAP_COLORS[0].color;
}

function getHeatmapBorderColor(intensity: number): string {
  if (intensity >= 0.8) return 'border-red-500';
  if (intensity >= 0.6) return 'border-orange-500';
  if (intensity >= 0.4) return 'border-yellow-500';
  if (intensity >= 0.2) return 'border-green-500';
  return 'border-green-300';
}

function getIntensityLabel(intensity: number): string {
  if (intensity >= 0.8) return '极高';
  if (intensity >= 0.6) return '较高';
  if (intensity >= 0.4) return '中等';
  if (intensity >= 0.2) return '较低';
  return '极低';
}

export function NearbyHeatmap({ className = '', onLocationRequired }: NearbyHeatmapProps) {
  const {
    isSharingEnabled,
    permissionState,
    currentLocation,
    getCurrentLocation,
    getNearbyHeatmap,
    precision,
  } = useLocationSharing();

  const [heatmapData, setHeatmapData] = useState<NearbyHeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatmapGridCell | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchHeatmapData = async () => {
    if (!isSharingEnabled) {
      setError('请先开启位置分享功能');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
      }

      if (!location) {
        setError('无法获取当前位置，请检查位置权限设置');
        onLocationRequired?.();
        return;
      }

      const data = await getNearbyHeatmap(location, 5000);

      if (!data || data.cells.length === 0) {
        const demoData = heatmapService.generateDemoHeatmapData(location, 5000);
        setHeatmapData(demoData);
        setUseDemoData(true);
      } else {
        setHeatmapData(data);
        setUseDemoData(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取热力图数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSharingEnabled && permissionState === 'granted') {
      fetchHeatmapData();
    }
  }, [isSharingEnabled, permissionState]);

  const gridSizeMeters = useMemo(() => {
    if (!currentLocation) return 0;
    return getGridSizeMeters(precision, currentLocation.lat);
  }, [currentLocation, precision]);

  const topHotspots = useMemo(() => {
    if (!heatmapData) return [];
    return heatmapData.cells.slice(0, 5);
  }, [heatmapData]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '暂无数据';
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isSharingEnabled || permissionState !== 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl p-5 shadow-soft ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <MapPin className="text-gray-400" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-800">
              附近热点
            </h3>
            <p className="text-xs text-gray-500">
              匿名分享位置，查看周边狗叫热力分布
            </p>
          </div>
        </div>
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-2">
            {permissionState === 'unsupported'
              ? '当前浏览器不支持位置功能'
              : permissionState === 'denied'
              ? '位置权限被拒绝，请在浏览器设置中开启'
              : '请先开启位置分享功能'}
          </p>
          <p className="text-gray-400 text-xs">
            位置数据会被脱敏处理，保护您的隐私
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-5 shadow-soft ${className}`}
      ref={containerRef}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Thermometer className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-800 flex items-center gap-2">
              附近热点
              {useDemoData && (
                <span className="text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  示例数据
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              周边区域匿名汇总的狗叫频次分布
            </p>
          </div>
        </div>
        <button
          onClick={fetchHeatmapData}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
          title="刷新数据"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-coral-50 border border-coral-200 rounded-xl mb-4"
        >
          <AlertCircle className="text-coral-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-coral-700">{error}</p>
        </motion.div>
      )}

      {isLoading && !heatmapData && (
        <div className="text-center py-12">
          <Loader2 size={32} className="mx-auto text-amber-500 animate-spin mb-3" />
          <p className="text-gray-500 text-sm">正在加载附近热点数据...</p>
        </div>
      )}

      {heatmapData && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {heatmapData.totalRecords}
              </div>
              <div className="text-xs text-gray-500">周边总记录</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {heatmapData.cells.length}
              </div>
              <div className="text-xs text-gray-500">热点区域</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-mint-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                ~{Math.round(heatmapData.radius / 1000)}km
              </div>
              <div className="text-xs text-gray-500">覆盖范围</div>
            </div>
          </div>

          <div className="relative bg-gray-50 rounded-xl p-4 mb-4 overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400">
              <Info size={12} />
              <span>网格精度: ~{gridSizeMeters}米</span>
            </div>

            <div className="aspect-square relative bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-amber-200 animate-pulse-soft z-10" />
              </div>

              {heatmapData.cells.map((cell, index) => {
                const latRange = heatmapData.cells.reduce(
                  (acc, c) => ({
                    min: Math.min(acc.min, c.gridLat),
                    max: Math.max(acc.max, c.gridLat),
                  }),
                  { min: Infinity, max: -Infinity }
                );
                const lngRange = heatmapData.cells.reduce(
                  (acc, c) => ({
                    min: Math.min(acc.min, c.gridLng),
                    max: Math.max(acc.max, c.gridLng),
                  }),
                  { min: Infinity, max: -Infinity }
                );

                const latSpread = latRange.max - latRange.min || 0.1;
                const lngSpread = lngRange.max - lngRange.min || 0.1;

                const top = ((latRange.max - cell.gridLat) / latSpread) * 80 + 10;
                const left = ((cell.gridLng - lngRange.min) / lngSpread) * 80 + 10;

                const size = Math.max(20, Math.min(60, cell.count * 2 + 20));

                return (
                  <motion.div
                    key={`${cell.gridLat}-${cell.gridLng}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    className={`absolute rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${getHeatmapBorderColor(
                      cell.intensity
                    )}`}
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: getHeatmapColor(cell.intensity),
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() =>
                      setSelectedCell(selectedCell === cell ? null : cell)
                    }
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {cell.count}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-3 px-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-400/60" />
                <span className="text-xs text-gray-500">低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-yellow-400/60" />
                <span className="text-xs text-gray-500">中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-orange-500/60" />
                <span className="text-xs text-gray-500">较高</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-red-500/70" />
                <span className="text-xs text-gray-500">高</span>
              </div>
            </div>
          </div>

          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 rounded-xl p-4 mb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame
                  size={16}
                  className={
                    selectedCell.intensity >= 0.6
                      ? 'text-orange-500'
                      : 'text-amber-500'
                  }
                />
                <span className="font-medium text-gray-800">热点详情</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">位置网格</div>
                  <div className="font-medium">
                    {formatGridLabel(selectedCell.gridLat, selectedCell.gridLng)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">狗叫次数</div>
                  <div className="font-bold text-amber-600">
                    {selectedCell.count} 次
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">热度等级</div>
                  <div
                    className={`font-medium ${
                      selectedCell.intensity >= 0.6
                        ? 'text-orange-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {getIntensityLabel(selectedCell.intensity)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">相对强度</div>
                  <div className="font-medium">
                    {Math.round(selectedCell.intensity * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {topHotspots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-500" />
                热门区域 TOP {topHotspots.length}
              </h4>
              <div className="space-y-2">
                {topHotspots.map((cell, index) => (
                  <motion.div
                    key={`${cell.gridLat}-${cell.gridLng}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedCell === cell
                        ? 'bg-amber-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() =>
                      setSelectedCell(selectedCell === cell ? null : cell)
                    }
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                          : index === 2
                          ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {formatGridLabel(cell.gridLat, cell.gridLng)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Flame
                          size={12}
                          className={
                            cell.intensity >= 0.6
                              ? 'text-orange-500'
                              : 'text-amber-500'
                          }
                        />
                        <span>{getIntensityLabel(cell.intensity)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">
                        {cell.count}
                      </div>
                      <div className="text-xs text-gray-400">次</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>数据更新: {formatDate(heatmapData.lastUpdated)}</span>
              </div>
              <span>数据日期: {heatmapData.dataDate}</span>
            </div>
            {useDemoData && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                <Info size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  当前展示的是示例数据。当有足够多的用户分享位置数据后，将显示真实的周边热点分布。
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
