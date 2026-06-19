import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  LogOut,
  Shield,
  Clock,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { AdminStatsCard } from '@/components/AdminStatsCard';
import { DailyActiveTrendChart } from '@/components/DailyActiveTrendChart';
import { RegionDistributionMap } from '@/components/RegionDistributionMap';
import { DateRangeFilter } from '@/components/DateRangeFilter';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const admin = useAdminStore((s) => s.admin);
  const isAdminAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const validateSession = useAdminStore((s) => s.validateSession);
  const logout = useAdminStore((s) => s.logout);

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    dateRange,
    dateRangeKey,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
    refresh,
    changeDateRange,
    applyCustomRange,
    getTimeUntilNextRefresh,
  } = useAdminDashboard();

  const [nextRefresh, setNextRefresh] = useState({ minutes: 5, seconds: 0 });
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAdminAuthenticated) {
        navigate('/admin/login');
        return;
      }
      const valid = await validateSession();
      if (!valid) {
        navigate('/admin/login');
      }
      setHasValidated(true);
    };
    checkAuth();
  }, [isAdminAuthenticated, navigate, validateSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefresh(getTimeUntilNextRefresh());
    }, 1000);
    return () => clearInterval(timer);
  }, [getTimeUntilNextRefresh]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const formatDateTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  if (!hasValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-display font-bold text-gray-800">
                  管理后台
                </h1>
                <p className="text-xs text-gray-500">数据仪表盘</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} />
                <span>
                  下次刷新: {nextRefresh.minutes}分{nextRefresh.seconds}秒
                </span>
              </div>

              <button
                onClick={refresh}
                disabled={isRefreshing || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
                {isRefreshing ? '刷新中...' : '手动刷新'}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">
                    {admin?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {admin?.role === 'super_admin' ? '超级管理员' : '管理员'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-coral-600 hover:bg-coral-50 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-coral-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-coral-700">{error}</p>
                <button
                  onClick={refresh}
                  className="mt-2 text-sm text-coral-600 hover:text-coral-700 font-medium"
                >
                  点击重试
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {data && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-soft border border-gray-100"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>数据更新时间: {formatDateTime(data.lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-2">
              {isRefreshing && (
                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Loader2 size={12} className="animate-spin" />
                  正在刷新数据...
                </span>
              )}
              <span className="text-xs text-gray-400">
                数据范围: {formatDateTime(data.dataFrom)} - {formatDateTime(data.dataTo)}
              </span>
            </div>
          </motion.div>
        )}

        <DateRangeFilter
          currentRange={dateRange}
          currentKey={dateRangeKey}
          onChange={changeDateRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          setCustomStartDate={setCustomStartDate}
          setCustomEndDate={setCustomEndDate}
          onApplyCustom={applyCustomRange}
        />

        {isLoading && !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white rounded-2xl animate-pulse"
                />
              ))}
            </div>
            <div className="h-96 bg-white rounded-2xl animate-pulse" />
            <div className="h-[500px] bg-white rounded-2xl animate-pulse" />
          </div>
        ) : (
          data && (
            <>
              <AdminStatsCard stats={data.stats} />
              <DailyActiveTrendChart data={data.dailyTrend} />
              <RegionDistributionMap data={data.regionDistribution} />
            </>
          )
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400">
            © 2024 狗叫记录分析器 · 管理后台 · 数据每5分钟自动刷新
          </p>
        </div>
      </footer>
    </div>
  );
}
