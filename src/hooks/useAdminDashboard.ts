import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import * as syncService from '@/services/syncService';
import { AdminDashboardData, AdminDateRange, ADMIN_DATE_RANGE_OPTIONS } from '@/types';

const REFRESH_INTERVAL = 5 * 60 * 1000;

export function useAdminDashboard() {
  const admin = useAdminStore((s) => s.admin);
  const logout = useAdminStore((s) => s.logout);

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<AdminDateRange>(() =>
    ADMIN_DATE_RANGE_OPTIONS.find((o) => o.key === 'last7days')!.getRange()
  );
  const [dateRangeKey, setDateRangeKey] = useState<string>('last7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const refreshTimerRef = useRef<number | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const handleAuthError = useCallback(
    async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('登录已过期') || msg.includes('身份不匹配')) {
        await logout();
        setError('登录已过期，请重新登录');
        return true;
      }
      return false;
    },
    [logout]
  );

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (!admin?.token) return;

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const result = await syncService.getAdminDashboardData(admin.token, {
          start: dateRange.start,
          end: dateRange.end,
        });
        setData(result);
        lastRefreshRef.current = Date.now();
      } catch (err) {
        const isAuthErr = await handleAuthError(err);
        if (!isAuthErr) {
          setError(err instanceof Error ? err.message : '获取数据失败');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [admin?.token, dateRange, handleAuthError]
  );

  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  const changeDateRange = useCallback(
    (key: string, customRange?: AdminDateRange) => {
      if (key === 'custom' && customRange) {
        setDateRange(customRange);
      } else {
        const option = ADMIN_DATE_RANGE_OPTIONS.find((o) => o.key === key);
        if (option) {
          setDateRange(option.getRange());
        }
      }
      setDateRangeKey(key);
    },
    []
  );

  const applyCustomRange = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      setError('请选择完整的日期范围');
      return;
    }

    const start = new Date(customStartDate).getTime();
    const end = new Date(customEndDate).getTime() + 86399999;

    if (start > end) {
      setError('开始日期不能晚于结束日期');
      return;
    }

    changeDateRange('custom', {
      start,
      end,
      label: `${customStartDate} 至 ${customEndDate}`,
    });
  }, [customStartDate, customEndDate, changeDateRange]);

  useEffect(() => {
    if (admin?.token) {
      fetchData();
    }
  }, [admin?.token, dateRange, fetchData]);

  useEffect(() => {
    if (admin?.token) {
      refreshTimerRef.current = window.setInterval(() => {
        refresh();
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [admin?.token, refresh]);

  const getTimeUntilNextRefresh = useCallback(() => {
    const elapsed = Date.now() - lastRefreshRef.current;
    const remaining = Math.max(0, REFRESH_INTERVAL - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return { minutes, seconds, remaining };
  }, []);

  return {
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
  };
}
